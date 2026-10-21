<?php

namespace Tests\Feature;

use App\Models\AbuseFlag;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OpsPagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function screens(): array
    {
        return [
            'overview' => ['/ops', 'Ops/Index'],
            'deliverability' => ['/ops/deliverability', 'Ops/Deliverability'],
            'delivery log' => ['/ops/delivery-log', 'Ops/Queue'],
            'domains' => ['/ops/domains', 'Ops/Domains'],
            'abuse' => ['/ops/abuse', 'Ops/Abuse'],
            'abuse detail' => ['/ops/abuse/{flag}', 'Ops/AbuseDetail'],
            'spam rules' => ['/ops/spam-rules', 'Ops/SpamRules'],
            'users' => ['/ops/users', 'Ops/Users'],
            'user' => ['/ops/users/{user}', 'Ops/User'],
            'mailboxes' => ['/ops/mailboxes', 'Ops/Mailboxes'],
            'refunds' => ['/ops/refunds', 'Ops/Refunds'],
            'backups' => ['/ops/backups', 'Ops/Backups'],
            'staff' => ['/ops/staff', 'Ops/Staff'],
            'audit' => ['/ops/audit', 'Ops/Audit'],
            'reports' => ['/ops/reports', 'Ops/Reports'],
        ];
    }

    private function uri(string $pattern): string
    {
        $uri = str_replace('{user}', (string) User::factory()->create()->id, $pattern);

        return str_contains($uri, '{flag}') ? str_replace('{flag}', AbuseFlag::factory()->create()->id, $uri) : $uri;
    }

    #[DataProvider('screens')]
    public function test_a_guest_is_sent_to_the_staff_sign_in(string $uri): void
    {
        $this->get($this->uri($uri))->assertRedirect('/ops/login');
    }

    #[DataProvider('screens')]
    public function test_a_customer_session_cannot_open_the_console(string $uri): void
    {
        $this->actingAs(User::factory()->create(), 'web');

        $this->get($this->uri($uri))->assertRedirect('/ops/login');
    }

    #[DataProvider('screens')]
    public function test_staff_without_two_factor_are_sent_to_enrol(string $uri): void
    {
        $this->actingAs(Staff::factory()->create(), 'staff');

        $this->get($this->uri($uri))->assertRedirect('/ops/security/enrol');
    }

    #[DataProvider('screens')]
    public function test_staff_with_two_factor_get_the_page_and_only_safe_staff_props(string $uri, string $component): void
    {
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->get($this->uri($uri))->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->has('staff', fn (Assert $staff) => $staff->hasAll(['name', 'email', 'role', 'twoFactorEnabled', 'recoveryCodesUnused'])->etc())
            ->missing('staff.password')
            ->missing('staff.two_factor_secret'));
    }

    public function test_the_staff_prop_is_absent_for_customers(): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs(User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail(), 'web');

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('staff', null));
    }
}
