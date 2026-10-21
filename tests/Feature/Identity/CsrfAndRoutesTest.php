<?php

namespace Tests\Feature\Identity;

use App\Http\Middleware\VerifyMailServerSignature;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class CsrfAndRoutesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return list<LaravelRoute>
     */
    private function stateChangingRoutes(): array
    {
        return collect(Route::getRoutes()->getRoutes())
            ->filter(fn (LaravelRoute $route) => array_intersect($route->methods(), ['POST', 'PUT', 'PATCH', 'DELETE']))
            ->reject(fn (LaravelRoute $route) => $this->isSignedServerRoute($route))
            ->values()
            ->all();
    }

    /**
     * The two kinds of route that are not browser forms: our mail server's report (signed with HMAC) and
     * the Pusher-protocol socket-auth endpoint (the socket presents the session cookie plus the channel
     * name, and the route returns a signed authorisation; it changes no state).
     */
    private function isSignedServerRoute(LaravelRoute $route): bool
    {
        return in_array(VerifyMailServerSignature::class, $route->gatherMiddleware(), true)
            || $route->uri() === 'broadcasting/auth';
    }

    public function test_the_only_routes_without_csrf_are_the_signed_server_report_and_the_socket_auth(): void
    {
        $exempt = collect(Route::getRoutes()->getRoutes())->filter(fn (LaravelRoute $route) => $this->isSignedServerRoute($route));

        $this->assertSame(['api/mail-events', 'broadcasting/auth'], $exempt->map->uri()->sort()->values()->all());
    }

    public function test_csrf_has_no_exemptions(): void
    {
        $property = new \ReflectionProperty(PreventRequestForgery::class, 'neverVerify');

        $this->assertSame([], $property->getValue());
    }

    public function test_every_state_changing_route_runs_the_csrf_check(): void
    {
        $routes = $this->stateChangingRoutes();
        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $stack = app('router')->resolveMiddleware($route->gatherMiddleware(), $route->excludedMiddleware());

            $this->assertContains(
                PreventRequestForgery::class,
                $stack,
                'Route ['.implode('|', $route->methods()).' '.$route->uri().'] escapes CSRF protection.'
            );
        }
    }

    public function test_every_state_changing_route_refuses_a_request_without_a_token(): void
    {
        // Laravel skips the check while testing; run as a real environment would.
        $this->app['env'] = 'local';

        foreach ($this->stateChangingRoutes() as $route) {
            $uri = preg_replace('/\{[^}]+\}/', '1', '/'.ltrim($route->uri(), '/'));
            $method = collect($route->methods())->first(fn ($m) => in_array($m, ['POST', 'PUT', 'PATCH', 'DELETE'], true));

            $this->call($method, $uri)->assertStatus(419, 'Route ['.$method.' '.$uri.'] answered without a CSRF token.');
        }
    }

    public function test_a_sibling_subdomain_or_another_site_cannot_stand_in_for_a_token(): void
    {
        $this->app['env'] = 'local';

        foreach (['same-site', 'cross-site', 'none'] as $site) {
            $this->withHeaders(['Sec-Fetch-Site' => $site])->post(route('login.store'), ['email' => 'a@b.test', 'password' => 'x'])->assertStatus(419);
        }

        // The browser's own same-origin marker is accepted, as the framework intends.
        $this->withHeaders(['Sec-Fetch-Site' => 'same-origin'])->post(route('login.store'), ['email' => 'a@b.test', 'password' => 'x'])->assertRedirect();
    }

    public function test_no_state_changing_api_route_exists_without_stateful_sanctum(): void
    {
        $api = array_filter(
            [...$this->stateChangingRoutes()],
            fn ($route) => str_starts_with($route->uri(), 'api/'),
        );

        // Today there are none; the count is asserted so the test records that, and fails the day one is added unguarded.
        $this->assertCount(0, array_filter($api, fn ($route) => ! in_array('auth:sanctum', $route->gatherMiddleware(), true)), 'An API route changes state without auth:sanctum.');
    }

    public function test_every_signed_in_surface_route_is_behind_a_guard(): void
    {
        $prefixes = ['dashboard', 'mail', 'onboarding', 'checkout', 'user'];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $first = explode('/', trim($route->uri(), '/'))[0];

            if ($first === 'ops') {
                if (! str_starts_with($route->uri(), 'ops/login')) {
                    $this->assertContains('auth:staff', $route->gatherMiddleware(), 'Ops route '.$route->uri().' is not behind the staff guard.');
                }

                continue;
            }

            if (! in_array($first, $prefixes, true)) {
                continue;
            }

            $this->assertContains('auth', $route->gatherMiddleware(), 'Route '.$route->uri().' is a signed-in surface without the auth middleware.');
        }
    }
}
