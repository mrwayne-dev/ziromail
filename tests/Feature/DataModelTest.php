<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DataModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_one_account_can_hold_a_domain_live_but_several_can_claim_it(): void
    {
        $first = Domain::factory()->create(['name' => 'Adaobifoods.com']);
        $second = Domain::factory()->create(['name' => 'adaobifoods.com']);

        $this->assertSame('adaobifoods.com', $first->name);
        $this->assertTrue($first->goLive());
        $this->assertFalse($second->goLive(), 'The database must refuse a second live owner.');

        $this->assertSame('live', $first->fresh()->state);
        $this->assertSame('pending', $second->fresh()->state);
        $this->assertNull($second->fresh()->live_name);
    }

    public function test_ids_are_ulids_not_guessable_counters(): void
    {
        $domain = Domain::factory()->create();

        $this->assertTrue(Str::isUlid($domain->id));
        $this->assertTrue(Str::isUlid(Mailbox::factory()->create(['domain_id' => $domain->id])->id));
    }

    public function test_the_pool_is_the_plan_plus_bought_storage_less_what_is_assigned(): void
    {
        $plan = Plan::factory()->create(['pool_gb' => 30]);
        $domain = Domain::factory()->withSubscription($plan, extraGb: 10)->create();
        Mailbox::factory()->create(['domain_id' => $domain->id, 'quota_gb' => 12, 'used_gb' => 4.2]);
        Mailbox::factory()->create(['domain_id' => $domain->id, 'quota_gb' => 8, 'used_gb' => 6.1]);

        $domain = $domain->fresh(['subscription.plan', 'mailboxes']);

        $this->assertSame(40, $domain->poolGb());
        $this->assertSame(20.0, $domain->assignedGb());
        $this->assertSame(10.3, $domain->usedGb());
        $this->assertSame(20.0, $domain->unassignedGb());
    }

    public function test_a_local_part_is_unique_per_domain_and_stored_lowercase(): void
    {
        $domain = Domain::factory()->create();
        Mailbox::factory()->create(['domain_id' => $domain->id, 'local_part' => 'Sales']);

        $this->assertDatabaseHas('mailboxes', ['local_part' => 'sales']);
        $this->expectException(QueryException::class);
        Mailbox::factory()->create(['domain_id' => $domain->id, 'local_part' => 'sales']);
    }

    public function test_protected_columns_cannot_be_mass_assigned(): void
    {
        $domain = new Domain(['name' => 'x.com', 'user_id' => 99, 'state' => 'live', 'live_name' => 'x.com']);
        $mailbox = new Mailbox(['local_part' => 'a', 'quota_gb' => 1, 'used_gb' => 50, 'provisioning_state' => 'done']);

        $this->assertNull($domain->user_id);
        $this->assertNull($domain->state);
        $this->assertNull($domain->live_name);
        $this->assertNull($mailbox->used_gb);
        $this->assertNull($mailbox->provisioning_state);
    }

    public function test_deleting_an_account_removes_its_domains_mailboxes_and_invoices(): void
    {
        $user = User::factory()->create();
        $domain = Domain::factory()->create(['user_id' => $user->id]);
        Mailbox::factory()->create(['domain_id' => $domain->id]);

        $user->delete();

        $this->assertDatabaseCount('domains', 0);
        $this->assertDatabaseCount('mailboxes', 0);
    }
}
