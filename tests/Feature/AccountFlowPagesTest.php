<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AccountFlowPagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string, 2: string}>
     */
    public static function flowPages(): array
    {
        return [
            'signup' => ['/signup', 'Auth/Signup', 'signup'],
            'login' => ['/login', 'Auth/Login', 'login'],
            'two factor' => ['/login/two-factor', 'Auth/TwoFactor', 'login.two-factor'],
            'recovery' => ['/login/recovery', 'Auth/Recovery', 'login.recovery'],
            'forgot password' => ['/forgot-password', 'Auth/ForgotPassword', 'password.request'],
            'verify email' => ['/verify-email', 'Auth/VerifyEmail', 'verification.notice'],
            'checkout payment' => ['/checkout', 'Checkout/Payment', 'checkout.payment'],
            'phone setup' => ['/setup', 'Setup/Device', 'setup.device'],
            'onboarding domain' => ['/onboarding/domain', 'Onboarding/Domain', 'onboarding.domain'],
        ];
    }

    private static function isProtected(string $uri): bool
    {
        return str_starts_with($uri, '/checkout') || str_starts_with($uri, '/onboarding');
    }

    #[DataProvider('flowPages')]
    public function test_page_renders_its_inertia_component(string $uri, string $component, string $name): void
    {
        if (in_array($uri, ['/login/two-factor', '/login/recovery'], true)) {
            // These steps exist only for a sign in that has already passed the password.
            $this->get($uri)->assertRedirect(route('login'));
            $user = User::factory()->withTwoFactor()->create();
            $this->withSession(['login.pending' => ['guard' => 'web', 'id' => $user->id, 'remember' => false, 'expires' => time() + 300]]);
        }

        if (self::isProtected($uri)) {
            // A guest is sent to sign in; a verified user sees the page.
            $this->get($uri)->assertRedirect(route('login'));
            $this->actingAs(User::factory()->create());
        }

        $this->get($uri)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component($component));

        $this->assertTrue(Route::has($name), "Route [$name] is not registered.");
        $this->assertSame(url($uri), route($name));
    }

    public function test_every_inertia_component_has_a_page_file(): void
    {
        foreach (self::flowPages() as [, $component]) {
            $this->assertFileExists(resource_path("js/Pages/{$component}.jsx"));
        }
    }

    public function test_flow_pages_are_not_in_the_sitemap(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'sitemap');
        $this->artisan('sitemap:generate', ['--path' => $path])->assertSuccessful();

        $xml = file_get_contents($path);
        unlink($path);

        $this->assertStringContainsString('/pricing', $xml);

        foreach (['/signup', '/login', '/checkout', '/onboarding', '/setup', '/verify-email', '/forgot-password'] as $fragment) {
            $this->assertStringNotContainsString($fragment, $xml);
        }
    }

    public function test_an_unverified_user_is_sent_to_the_verify_screen_from_protected_pages(): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        foreach (['/checkout', '/onboarding/domain'] as $uri) {
            $this->get($uri)->assertRedirect(route('verification.notice'));
        }
    }
}
