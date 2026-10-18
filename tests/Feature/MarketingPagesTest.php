<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MarketingPagesTest extends TestCase
{
    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function publicPages(): array
    {
        return [
            'home' => ['/', 'Public/Index'],
            'pricing' => ['/pricing', 'Public/Pricing'],
            'features' => ['/features', 'Public/Features'],
            'switching' => ['/switching', 'Public/Migrate'],
            'help' => ['/help', 'Public/Help'],
            'contact' => ['/contact', 'Public/Contact'],
            'status' => ['/status', 'Public/Status'],
            'terms' => ['/legal/terms', 'Legal/Terms'],
            'privacy' => ['/legal/privacy', 'Legal/Privacy'],
            'aup' => ['/legal/aup', 'Legal/Aup'],
            'refunds' => ['/legal/refunds', 'Legal/Refunds'],
            'offline' => ['/offline', 'Errors/Offline'],
        ];
    }

    #[DataProvider('publicPages')]
    public function test_public_page_renders_its_inertia_component(string $uri, string $component): void
    {
        $this->get($uri)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component($component)
                ->where('site.name', 'Ziroemail'));
    }

    public function test_every_named_route_a_page_links_to_resolves(): void
    {
        // The public pages call route() with these names; a missing one would
        // throw in the browser, not here.
        foreach (['home', 'pricing', 'features', 'migrate', 'help', 'contact', 'status',
            'legal.terms', 'legal.privacy', 'legal.aup', 'legal.refunds',
            'login', 'signup', 'setup.device', 'mail', 'dashboard'] as $name) {
            $this->assertTrue(Route::has($name), "Route [$name] is not registered.");
        }
    }

    public function test_routes_for_later_phases_are_behind_sign_in_until_built(): void
    {
        foreach (['/mail', '/dashboard'] as $uri) {
            $this->get($uri)->assertRedirect(route('login'));
        }
    }

    public function test_unknown_url_renders_the_branded_not_found_page(): void
    {
        config(['app.debug' => false]);

        $this->get('/no-such-page')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Errors/NotFound')
                ->where('site.url', rtrim(config('app.url'), '/')));
    }

    public function test_unhandled_exception_renders_the_branded_server_error_page(): void
    {
        config(['app.debug' => false]);
        Route::get('/_boom', fn () => throw new \RuntimeException('boom'));

        $this->get('/_boom')
            ->assertStatus(500)
            ->assertInertia(fn (Assert $page) => $page->component('Errors/ServerError'));
    }

    public function test_service_unavailable_renders_the_maintenance_page(): void
    {
        config(['app.debug' => false]);
        Route::get('/_down', fn () => abort(503));

        $this->get('/_down')
            ->assertStatus(503)
            ->assertInertia(fn (Assert $page) => $page->component('Errors/Maintenance'));
    }

    public function test_api_errors_stay_json(): void
    {
        config(['app.debug' => false]);

        $this->getJson('/api/does-not-exist')->assertNotFound()->assertJsonStructure(['message']);
    }

    public function test_sitemap_lists_every_flagged_route_and_nothing_else(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'sitemap');
        config(['app.url' => 'https://ziroemail.com']);

        $this->artisan('sitemap:generate', ['--path' => $path])->assertSuccessful();
        $xml = file_get_contents($path);
        unlink($path);

        foreach (['/', '/pricing', '/features', '/switching', '/help', '/contact', '/status',
            '/legal/terms', '/legal/privacy', '/legal/aup', '/legal/refunds'] as $uri) {
            $this->assertStringContainsString('<loc>https://ziroemail.com'.$uri.'</loc>', $xml);
        }

        // System, later-phase and framework routes must not be indexed.
        foreach (['/offline', '/login', '/signup', '/setup', '/mail', '/up', '/_preview'] as $uri) {
            $this->assertStringNotContainsString('https://ziroemail.com'.$uri.'<', $xml);
        }
        $this->assertSame(11, substr_count($xml, '<url>'));
    }
}
