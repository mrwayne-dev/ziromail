<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OpsDataPagesTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(string $role = 'owner'): Staff
    {
        $staff = Staff::factory()->withTwoFactor()->create(['role' => $role]);
        $this->actingAs($staff, 'staff');

        return $staff;
    }

    public function test_the_mailbox_page_counts_sizes_and_states_and_filters(): void
    {
        $this->seed(DemoSeeder::class);
        $this->signIn();

        $this->get(route('ops.mailboxes', ['filter' => 'all']))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Mailboxes')
            ->where('figures.total', 6)
            ->where('figures.never', 1)
            ->where('counts.all', 6)
            ->has('rows', 6)
            ->where('rows.0.address', fn ($a) => str_contains($a, '@'))
            ->missing('rows.0.subject'));

        $this->get(route('ops.mailboxes', ['filter' => 'never']))->assertInertia(fn (Assert $p) => $p->has('rows', 1)->where('rows.0.address', 'emeka@adaobifoods.com'));
        $this->get(route('ops.mailboxes', ['q' => 'adaobiexport', 'filter' => 'all']))->assertInertia(fn (Assert $p) => $p->where('page.total', 2));
    }

    public function test_the_staff_page_reads_the_real_roster_and_flags_a_single_owner(): void
    {
        $me = $this->signIn();

        $this->get(route('ops.staff'))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Staff')
            ->has('people', 1)
            ->where('people.0.email', $me->email)
            ->where('people.0.twoFactorEnabled', true)
            ->where('owners', 1)
            ->missing('people.0.password')
            ->missing('people.0.two_factor_secret'));
    }

    public function test_the_report_counts_real_rows_and_does_not_invent_uptime_or_support(): void
    {
        $this->seed(DemoSeeder::class);
        Invoice::query()->update(['issued_at' => now()->toDateString()]);
        $this->signIn();

        $response = $this->get(route('ops.reports'))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Reports')
            ->where('headline.newUsers', 1)
            ->where('headline.billedMinor', 3612000)
            ->where('billing.invoices', 2)
            ->has('usersByMonth', 6));

        $json = json_encode($response->viewData('page')['props']);
        foreach (['uptime', 'refund', 'support', 'departures'] as $invented) {
            $this->assertStringNotContainsString('"'.$invented, $json);
        }
    }

    public function test_a_customer_cannot_open_these_pages(): void
    {
        $this->actingAs(User::factory()->create(), 'web');

        foreach (['ops.mailboxes', 'ops.staff', 'ops.reports', 'ops.audit'] as $name) {
            $this->get(route($name))->assertRedirect('/ops/login');
        }
    }
}
