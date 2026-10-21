<?php

namespace Tests\Feature;

use App\Http\Requests\Dashboard\StoreDomainRequest;
use App\Models\Domain;
use App\Models\DomainRecord;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DomainManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_adding_a_domain_creates_four_expected_records_and_an_unpaid_subscription(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('dashboard.domains.store'), ['name' => 'https://www.Newbiz.com/about', 'plan' => 'business'])->assertRedirect();

        $domain = Domain::query()->where('name', 'newbiz.com')->firstOrFail();
        $this->assertSame('pending', $domain->state);
        $this->assertNull($domain->live_name);
        $this->assertSame(['MX', 'SPF', 'DKIM', 'DMARC'], $domain->records()->orderByRaw("FIELD(type,'MX','SPF','DKIM','DMARC')")->pluck('type')->all());
        $this->assertSame('incomplete', $domain->subscription->status);
        $this->assertDatabaseHas('audit_log', ['action' => 'domain.added', 'account_id' => $user->id]);
    }

    public function test_every_failure_to_add_gives_the_same_neutral_message(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();
        Domain::factory()->withSubscription(Plan::first())->create(['user_id' => $theirs->id, 'name' => 'taken.com'])->goLive();
        Domain::factory()->create(['user_id' => $mine->id, 'name' => 'mine.com']);
        $this->actingAs($mine);

        foreach (['taken.com', 'mine.com', 'not a domain', '', 'x'] as $name) {
            $this->withHeader('X-Inertia', 'true')->post(route('dashboard.domains.store'), ['name' => $name, 'plan' => 'starter'])
                ->assertSessionHasErrors(['name' => StoreDomainRequest::NEUTRAL]);
        }
        $this->assertSame(2, Domain::query()->count());
    }

    public function test_a_name_another_account_is_only_claiming_can_also_be_claimed(): void
    {
        $first = User::factory()->create();
        Domain::factory()->create(['user_id' => $first->id, 'name' => 'shared.com']);

        $this->actingAs(User::factory()->create())->post(route('dashboard.domains.store'), ['name' => 'shared.com', 'plan' => 'starter'])->assertRedirect();

        $this->assertSame(2, Domain::query()->where('name', 'shared.com')->count());
    }

    public function test_another_accounts_domain_is_a_404_for_detail_and_recheck(): void
    {
        $theirs = Domain::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->get(route('dashboard.domains.show', $theirs->id))->assertNotFound();
        $this->post(route('dashboard.domains.recheck', $theirs->id))->assertNotFound();
    }

    public function test_the_detail_page_lists_the_records_and_invents_no_delivery_figures(): void
    {
        $user = User::factory()->create();
        $domain = Domain::factory()->withSubscription(Plan::first())->create(['user_id' => $user->id]);
        DomainRecord::factory()->create(['domain_id' => $domain->id, 'type' => 'DKIM', 'status' => 'missing', 'expected' => ['host' => 'ziro._domainkey', 'value' => 'v=DKIM1']]);

        $this->actingAs($user)->get(route('dashboard.domains.show', $domain->id))->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Domain')
            ->where('records.0.type', 'DKIM')
            ->where('records.0.status', 'missing')
            ->where('placement', null)
            ->where('reputation', null));
    }

    public function test_a_recheck_with_no_dns_connection_changes_nothing_and_says_so(): void
    {
        $user = User::factory()->create();
        $domain = Domain::factory()->create(['user_id' => $user->id]);
        $record = DomainRecord::factory()->create(['domain_id' => $domain->id, 'status' => 'passing']);

        $this->actingAs($user)->post(route('dashboard.domains.recheck', $domain->id))->assertSessionHas('status', 'dns-unavailable');

        $this->assertSame('passing', $record->fresh()->status);
        $this->assertNull($record->fresh()->last_checked_at);
    }
}
