<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DashboardPagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function screens(): array
    {
        return [
            'overview' => ['/dashboard', 'Dashboard/Index'],
            'mailboxes' => ['/dashboard/mailboxes', 'Dashboard/Mailboxes'],
            'mailbox' => ['/dashboard/mailboxes/mb_sales', 'Dashboard/Mailbox'],
            'domains' => ['/dashboard/domains', 'Dashboard/Domains'],
            'domain' => ['/dashboard/domains/dom_foods', 'Dashboard/Domain'],
            'addresses' => ['/dashboard/addresses', 'Dashboard/Aliases'],
            'team' => ['/dashboard/team', 'Dashboard/Team'],
            'billing' => ['/dashboard/billing', 'Dashboard/Billing'],
            'storage' => ['/dashboard/billing/storage', 'Dashboard/Storage'],
            'activity' => ['/dashboard/activity', 'Dashboard/Audit'],
            'help' => ['/dashboard/help', 'Dashboard/Help'],
        ];
    }

    #[DataProvider('screens')]
    public function test_a_guest_is_sent_to_sign_in(string $uri): void
    {
        $this->get($uri)->assertRedirect(route('login'));
    }

    #[DataProvider('screens')]
    public function test_an_unverified_user_is_sent_to_verify_their_address(string $uri): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->get($uri)->assertRedirect(route('verification.notice'));
    }

    #[DataProvider('screens')]
    public function test_a_verified_user_gets_the_page_with_the_prototype_flag(string $uri, string $component): void
    {
        $this->actingAs(User::factory()->create());

        $this->get($uri)->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->where('site.prototype', true)
            ->where('auth.user.name', fn ($name) => is_string($name)));
    }

    public function test_the_prototype_flag_can_be_turned_off(): void
    {
        config(['app.prototype' => false]);
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('site.prototype', false));
    }
}
