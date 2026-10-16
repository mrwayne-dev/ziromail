<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AccountFlowPagesTest extends TestCase
{
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
            'checkout transfer' => ['/checkout/transfer', 'Checkout/Transfer', 'checkout.transfer'],
            'phone setup' => ['/setup', 'Setup/Device', 'setup.device'],
            'onboarding domain' => ['/onboarding/domain', 'Onboarding/Domain', 'onboarding.domain'],
            'onboarding plan' => ['/onboarding/plan', 'Onboarding/Plan', 'onboarding.plan'],
            'onboarding records' => ['/onboarding/records', 'Onboarding/Records', 'onboarding.records'],
            'onboarding assisted' => ['/onboarding/assisted', 'Onboarding/Assisted', 'onboarding.assisted'],
            'onboarding mailboxes' => ['/onboarding/mailboxes', 'Onboarding/Mailboxes', 'onboarding.mailboxes'],
            'onboarding done' => ['/onboarding/done', 'Onboarding/Done', 'onboarding.done'],
        ];
    }

    #[DataProvider('flowPages')]
    public function test_page_renders_its_inertia_component(string $uri, string $component, string $name): void
    {
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

    public function test_the_webmail_and_dashboard_destinations_still_answer_404(): void
    {
        $this->get('/mail')->assertNotFound();
        $this->get('/dashboard')->assertNotFound();
    }
}
