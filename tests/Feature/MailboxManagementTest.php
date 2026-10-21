<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MailboxManagementTest extends TestCase
{
    use RefreshDatabase;

    /** A 40 GB pool (30 plan plus 10 bought) with `sales` holding 8 GB, 6.1 used. */
    private function account(): array
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->create(['pool_gb' => 30]);
        $domain = Domain::factory()->withSubscription($plan, extraGb: 10)->create(['user_id' => $user->id, 'name' => 'adaobifoods.com']);
        $sales = Mailbox::factory()->create(['domain_id' => $domain->id, 'local_part' => 'sales', 'quota_gb' => 8, 'state' => 'active']);
        $sales->forceFill(['used_gb' => 6.1])->save();

        return [$user, $domain, $sales];
    }

    private function payload(Domain $domain, array $over = []): array
    {
        return array_merge(['domain' => $domain->id, 'local_part' => 'accounts', 'quota_gb' => 2, 'password_mode' => 'link'], $over);
    }

    public function test_creating_a_mailbox_takes_storage_from_the_pool_and_is_audited(): void
    {
        [$user, $domain] = $this->account();

        $this->actingAs($user)->post(route('dashboard.mailboxes.store'), $this->payload($domain))->assertRedirect();

        $this->assertDatabaseHas('mailboxes', ['domain_id' => $domain->id, 'local_part' => 'accounts', 'provisioning_state' => 'pending']);
        $this->assertSame(10.0, $domain->fresh(['subscription.plan', 'mailboxes'])->assignedGb());
        $this->assertDatabaseHas('audit_log', ['action' => 'mailbox.created', 'account_id' => $user->id, 'category' => 'mailboxes']);
    }

    public function test_the_server_refuses_a_quota_bigger_than_the_free_pool_and_a_duplicate_address(): void
    {
        [$user, $domain] = $this->account();

        $this->actingAs($user)->post(route('dashboard.mailboxes.store'), $this->payload($domain, ['quota_gb' => 33]))
            ->assertSessionHasErrors(['quota_gb' => 'Only 32 GB is unassigned in the pool. Choose a smaller quota or add storage.']);
        $this->actingAs($user)->post(route('dashboard.mailboxes.store'), $this->payload($domain, ['local_part' => 'SALES']))
            ->assertSessionHasErrors('local_part');

        $this->assertDatabaseCount('mailboxes', 1);
    }

    public function test_a_first_password_is_never_stored_or_audited(): void
    {
        [$user, $domain] = $this->account();

        $this->actingAs($user)->post(route('dashboard.mailboxes.store'), $this->payload($domain, ['password_mode' => 'set', 'first_password' => 'Correct-Horse-Battery-9']))->assertRedirect();

        $this->assertDatabaseHas('mailboxes', ['local_part' => 'accounts', 'require_password_change' => true]);
        $dump = json_encode([Mailbox::query()->get()->toArray(), AuditLog::query()->get()->toArray()]);
        $this->assertStringNotContainsString('Correct-Horse-Battery-9', $dump);
    }

    public function test_another_accounts_domain_and_mailbox_cannot_be_touched(): void
    {
        [, $theirDomain, $theirSales] = $this->account();
        [$me] = $this->account();

        $this->actingAs($me)->post(route('dashboard.mailboxes.store'), $this->payload($theirDomain))->assertNotFound();
        $this->actingAs($me)->get(route('dashboard.mailboxes.show', $theirSales->id))->assertNotFound();
        $this->actingAs($me)->patch(route('dashboard.mailboxes.update', $theirSales->id), ['quota_gb' => 9])->assertNotFound();
        $this->actingAs($me)->delete(route('dashboard.mailboxes.destroy', $theirSales->id))->assertNotFound();

        $this->assertSame(8.0, $theirSales->fresh()->quota_gb);
        $this->assertNull($theirSales->fresh()->deleted_at);
    }

    public function test_a_quota_cannot_go_below_use_or_above_the_pool(): void
    {
        [$user, , $sales] = $this->account();
        $this->actingAs($user);

        $this->patch(route('dashboard.mailboxes.update', $sales->id), ['quota_gb' => 6])
            ->assertSessionHasErrors(['quota_gb' => 'This mailbox already uses 6.1 GB, so its quota cannot go lower.']);
        $this->patch(route('dashboard.mailboxes.update', $sales->id), ['quota_gb' => 41])
            ->assertSessionHasErrors('quota_gb');
        $this->patch(route('dashboard.mailboxes.update', $sales->id), ['quota_gb' => 12.5])->assertSessionHasNoErrors();

        $this->assertSame(12.5, $sales->fresh()->quota_gb);
        $this->assertDatabaseHas('audit_log', ['action' => 'mailbox.quota_changed', 'subject_id' => $sales->id]);
    }

    public function test_only_known_setting_keys_are_accepted(): void
    {
        [$user, , $sales] = $this->account();

        $this->actingAs($user)->patchJson(route('dashboard.mailboxes.update', $sales->id), [
            'forwarding' => ['to' => 'boss@example.com', 'keepCopy' => true, 'admin' => true],
        ])->assertStatus(422)->assertJsonValidationErrors('forwarding');

        $this->actingAs($user)->patch(route('dashboard.mailboxes.update', $sales->id), ['used_gb' => 0, 'forwarding' => ['to' => 'boss@example.com', 'keepCopy' => false]])->assertSessionHasNoErrors();
        $this->assertSame(6.1, $sales->fresh()->used_gb);
        $this->assertSame('boss@example.com', $sales->fresh()->settings['forwarding']['to']);
    }

    public function test_deleting_holds_the_mailbox_and_frees_its_storage(): void
    {
        [$user, $domain, $sales] = $this->account();

        $this->actingAs($user)->delete(route('dashboard.mailboxes.destroy', $sales->id))->assertRedirect();

        $this->assertSoftDeleted('mailboxes', ['id' => $sales->id]);
        $this->assertSame(0.0, $domain->fresh(['subscription.plan', 'mailboxes'])->assignedGb());
    }

    public function test_the_mailbox_pages_read_the_database(): void
    {
        [$user, , $sales] = $this->account();
        $this->actingAs($user);

        $this->get(route('dashboard.mailboxes'))->assertInertia(fn (Assert $p) => $p->component('Dashboard/Mailboxes')->where('pool.unassignedGb', 32)->where('mailboxes.0.local', 'sales'));
        $this->get(route('dashboard.mailboxes.show', $sales->id))->assertInertia(fn (Assert $p) => $p->component('Dashboard/Mailbox')->where('mailbox.address', 'sales@adaobifoods.com'));
    }
}
