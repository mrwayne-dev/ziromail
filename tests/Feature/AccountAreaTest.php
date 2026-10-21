<?php

namespace Tests\Feature;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Alias;
use App\Models\Delegation;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\Plan;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountAreaTest extends TestCase
{
    use RefreshDatabase;

    private function owner(): User
    {
        $this->seed(DemoSeeder::class);

        return User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail();
    }

    private function domain(User $owner): Domain
    {
        return Domain::query()->where('user_id', $owner->id)->where('name', 'adaobifoods.com')->firstOrFail();
    }

    private function confirmed(): array
    {
        return ['auth.password_confirmed_at' => now()->getTimestamp()];
    }

    public function test_an_address_is_an_alias_for_one_mailbox_and_a_forward_for_several(): void
    {
        $owner = $this->owner();
        $domain = $this->domain($owner);

        $this->actingAs($owner)->post(route('dashboard.aliases.store'), ['domain' => $domain->id, 'local_part' => 'support', 'destinations' => ['victory@adaobifoods.com', 'ngozi@adaobifoods.com']])->assertRedirect();

        $this->get(route('dashboard.aliases'))->assertInertia(fn (Assert $p) => $p->where('aliases', fn ($rows) => collect($rows)->contains(fn ($r) => $r['address'] === 'support@adaobifoods.com' && $r['type'] === 'forward')));
        $this->assertDatabaseHas('audit_log', ['action' => 'alias.saved', 'account_id' => $owner->id]);
    }

    public function test_an_address_cannot_clash_with_a_mailbox_or_point_at_a_mailbox_that_does_not_exist(): void
    {
        $owner = $this->owner();
        $domain = $this->domain($owner);
        $this->actingAs($owner);

        $this->withHeader('X-Inertia', 'true')->post(route('dashboard.aliases.store'), ['domain' => $domain->id, 'local_part' => 'sales', 'destinations' => ['victory']])->assertSessionHasErrors('local_part');
        $this->withHeader('X-Inertia', 'true')->post(route('dashboard.aliases.store'), ['domain' => $domain->id, 'local_part' => 'newone', 'destinations' => ['ghost']])->assertSessionHasErrors('destinations');
    }

    public function test_another_accounts_alias_cannot_be_changed_or_removed(): void
    {
        $theirs = Alias::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->put(route('dashboard.aliases.update', $theirs->id), ['domain' => $theirs->domain_id, 'local_part' => 'x', 'destinations' => ['a']])->assertNotFound();
        $this->delete(route('dashboard.aliases.destroy', $theirs->id))->assertNotFound();
        $this->assertModelExists($theirs);
    }

    public function test_inviting_an_administrator_sends_one_email_and_changes_nothing_else(): void
    {
        Notification::fake();
        $owner = $this->owner();

        $this->actingAs($owner)->post(route('dashboard.team.invite'), ['email' => 'Accountant@Example.com'])->assertSessionHas('status', 'invited');

        $this->assertDatabaseHas('team_members', ['owner_id' => $owner->id, 'email' => 'accountant@example.com', 'member_id' => null]);
        Notification::assertSentOnDemand(TeamInvitationNotification::class);
        $this->assertDatabaseHas('audit_log', ['action' => 'access.admin_added', 'account_id' => $owner->id]);
    }

    public function test_an_invited_person_with_a_verified_address_sees_the_owners_account_but_cannot_do_owner_things(): void
    {
        $owner = $this->owner();
        $member = User::factory()->create(['email' => 'accountant@example.com']);
        TeamMember::factory()->create(['owner_id' => $owner->id, 'email' => 'accountant@example.com']);

        $this->actingAs($member)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('domain.name', 'adaobifoods.com')->where('account.isOwner', false));
        $this->assertNotNull(TeamMember::query()->where('email', 'accountant@example.com')->value('accepted_at'));

    }

    public function test_an_unverified_address_does_not_unlock_an_invitation(): void
    {
        $owner = $this->owner();
        $unverified = User::factory()->unverified()->create(['email' => 'late@example.com']);
        TeamMember::factory()->create(['owner_id' => $owner->id, 'email' => 'late@example.com']);

        $this->actingAs($unverified)->get('/dashboard')->assertRedirect(route('verification.notice'));
        $this->assertNull(TeamMember::query()->where('email', 'late@example.com')->value('accepted_at'));
    }

    public function test_removing_an_administrator_ends_their_access_at_once(): void
    {
        $owner = $this->owner();
        $member = User::factory()->create(['email' => 'gone@example.com']);
        $row = TeamMember::factory()->create(['owner_id' => $owner->id, 'email' => 'gone@example.com']);

        $this->actingAs($member)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('domain.name', 'adaobifoods.com'));

        TeamMember::query()->whereKey($row->id)->update(['revoked_at' => now()]);

        $this->get('/dashboard')->assertRedirect(route('onboarding.domain'));
    }

    public function test_the_owner_can_remove_an_administrator_with_a_recent_password_check(): void
    {
        $owner = $this->owner();
        $row = TeamMember::factory()->create(['owner_id' => $owner->id, 'email' => 'gone@example.com']);

        $this->actingAs($owner)->withSession($this->confirmed())->delete(route('dashboard.team.remove', $row->id))->assertRedirect();

        $this->assertNotNull($row->fresh()->revoked_at);
        $this->assertDatabaseHas('audit_log', ['action' => 'access.admin_removed', 'account_id' => $owner->id]);
    }

    public function test_an_administrator_cannot_buy_storage_invite_or_remove_anyone(): void
    {
        $owner = $this->owner();
        $member = User::factory()->create(['email' => 'admin@example.com']);
        $row = TeamMember::factory()->create(['owner_id' => $owner->id, 'email' => 'admin@example.com']);
        $this->actingAs($member);

        $this->get(route('dashboard.storage'))->assertForbidden();
        $this->post(route('dashboard.team.invite'), ['email' => 'x@example.com'])->assertForbidden();
        $this->withSession($this->confirmed())->delete(route('dashboard.team.remove', $row->id))->assertForbidden();
        $this->post(route('dashboard.domains.store'), ['name' => 'extra.com', 'plan' => 'starter'])->assertForbidden();
    }

    public function test_withdrawing_an_agency_needs_the_password_and_is_audited(): void
    {
        $owner = $this->owner();
        $delegation = Delegation::query()->where('owner_id', $owner->id)->firstOrFail();

        $this->actingAs($owner)->delete(route('dashboard.team.withdraw', $delegation->id))->assertRedirect();
        $this->assertNull($delegation->fresh()->revoked_at);

        $this->withSession($this->confirmed())->delete(route('dashboard.team.withdraw', $delegation->id))->assertRedirect();
        $this->assertNotNull($delegation->fresh()->revoked_at);
        $this->assertDatabaseHas('audit_log', ['action' => 'access.delegation_withdrawn', 'account_id' => $owner->id]);
    }

    public function test_the_activity_log_shows_only_this_accounts_entries_and_exports_safely(): void
    {
        $owner = $this->owner();
        $other = User::factory()->create();
        app(AuditLogger::class)->account(AuditAction::MailboxCreated, $other, 'mailboxes', 'You created *secret@other.com*');
        app(AuditLogger::class)->account(AuditAction::MailboxCreated, $owner, 'mailboxes', '=HYPERLINK("http://evil")');

        $this->actingAs($owner)->get(route('dashboard.audit'))->assertInertia(fn (Assert $p) => $p->where('entries', fn ($e) => ! str_contains(json_encode($e), 'secret@other.com')));

        $csv = $this->get(route('dashboard.audit.export'))->assertOk()->streamedContent();
        $this->assertStringNotContainsString('secret@other.com', $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv, 'A formula in a cell must be neutralised.');
        $this->assertDatabaseHas('audit_log', ['action' => 'access.log_exported', 'account_id' => $owner->id]);
    }

    public function test_billing_and_storage_read_the_plans_table_so_a_price_change_shows_at_once(): void
    {
        $owner = $this->owner();
        Plan::query()->where('code', 'business')->update(['price_ngn_yearly' => 3000000]);
        $this->actingAs($owner);

        $this->get(route('dashboard.billing'))->assertInertia(fn (Assert $p) => $p->where('plans.1.price.NGN.yearly', 3000000)->where('invoices.0.number', fn ($n) => str_starts_with($n, 'ZIRO-')));
        $this->get(route('dashboard.storage'))->assertInertia(fn (Assert $p) => $p->where('extraStorage.blockGb', 10)->where('paymentsConnected', false));
    }

    public function test_a_mailbox_in_another_account_is_never_a_destination(): void
    {
        $owner = $this->owner();
        $stranger = Mailbox::factory()->create(['local_part' => 'stranger']);
        $this->actingAs($owner)->withHeader('X-Inertia', 'true')
            ->post(route('dashboard.aliases.store'), ['domain' => $this->domain($owner)->id, 'local_part' => 'x1', 'destinations' => [$stranger->local_part]])
            ->assertSessionHasErrors('destinations');
    }
}
