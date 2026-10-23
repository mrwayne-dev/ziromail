<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use Database\Seeders\DemoSeeder;
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
            'overview' => ['/dashboard', 'Dashboard/Overview'],
            'mailboxes' => ['/dashboard/mailboxes', 'Dashboard/Mailboxes'],
            'mailbox' => ['/dashboard/mailboxes/{mailbox}', 'Dashboard/Mailbox'],
            'domains' => ['/dashboard/domains', 'Dashboard/Domains'],
            'domain' => ['/dashboard/domains/{domain}', 'Dashboard/Domain'],
            'addresses' => ['/dashboard/addresses', 'Dashboard/Aliases'],
            'team' => ['/dashboard/team', 'Dashboard/Team'],
            'billing' => ['/dashboard/billing', 'Dashboard/Billing'],
            'storage' => ['/dashboard/billing/storage', 'Dashboard/Storage'],
            'activity' => ['/dashboard/activity', 'Dashboard/Audit'],
            'help' => ['/dashboard/help', 'Dashboard/Help'],
        ];
    }

    private function uri(string $pattern): string
    {
        return str_replace(['{mailbox}', '{domain}'], [(string) Mailbox::query()->value('id'), (string) Domain::query()->value('id')], $pattern);
    }

    #[DataProvider('screens')]
    public function test_a_guest_is_sent_to_sign_in(string $uri): void
    {
        $this->get(str_replace(['{mailbox}', '{domain}'], 'x', $uri))->assertRedirect(route('login'));
    }

    #[DataProvider('screens')]
    public function test_an_unverified_user_is_sent_to_verify_their_address(string $uri): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->get(str_replace(['{mailbox}', '{domain}'], 'x', $uri))->assertRedirect(route('verification.notice'));
    }

    #[DataProvider('screens')]
    public function test_a_verified_owner_gets_every_page_from_the_database(string $pattern, string $component): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs(User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail());

        $this->get($this->uri($pattern))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->where('account.isOwner', true)
            ->has('account.domains', 2));
    }

    public function test_the_shared_site_prop_no_longer_carries_a_prototype_flag(): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs(User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail());

        // The old "preview / demonstration data" banner is gone; nothing on the dashboard renders demo data
        // any more, so there is no flag for the UI to gate on. See docs/BUILD_LOG.md 2026-10-23 (Phase A).
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->missing('site.prototype'));
    }
}
