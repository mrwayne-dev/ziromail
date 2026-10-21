<?php

namespace Tests\Feature;

use App\Models\AbuseFlag;
use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\SendingStat;
use App\Models\Staff;
use App\Models\User;
use App\Notifications\SendingRestrictedNotification;
use App\Services\Abuse\AbuseEvaluator;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AbuseBotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['abuse.mode' => 'live']);
    }

    private function mailbox(): Mailbox
    {
        $owner = User::factory()->create();

        return Mailbox::factory()->for(Domain::factory()->for($owner, 'user'))->create();
    }

    private function sent(Mailbox $mailbox, int $sent, int $bounced = 0, int $complaints = 0, ?\DateTimeInterface $hour = null): Carbon
    {
        $hour = Carbon::instance($hour ?? now())->startOfHour();
        $stat = new SendingStat(['hour' => $hour, 'sent' => $sent, 'bounced' => $bounced, 'complaints' => $complaints]);
        $stat->mailbox_id = $mailbox->id;
        $stat->save();

        return $hour;
    }

    private function evaluate(Mailbox $mailbox, Carbon $hour): ?AbuseFlag
    {
        Notification::fake();

        return app(AbuseEvaluator::class)->evaluate($mailbox->load('domain.user'), $hour);
    }

    public function test_ordinary_sending_raises_nothing(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 30, 1);

        $this->assertNull($this->evaluate($mailbox, $hour));
        $this->assertSame(0, AbuseFlag::query()->count());
    }

    public function test_a_busy_account_is_judged_against_its_own_history(): void
    {
        $mailbox = $this->mailbox();
        // A steady sender: 100 an hour for the last ten days.
        foreach (range(2, 240) as $back) {
            $this->sent($mailbox, 100, 0, 0, now()->subHours($back));
        }
        $hour = $this->sent($mailbox, 120);

        $this->assertNull($this->evaluate($mailbox, $hour));
    }

    public function test_a_single_trip_slows_sending_and_waits_for_a_person(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 40, 10);

        $flag = $this->evaluate($mailbox, $hour);

        $this->assertSame(['bounce'], $flag->rules);
        $this->assertSame('open', $flag->status);
        $this->assertSame('limited', $mailbox->fresh()->sending_state);
        $this->assertSame('limited', $flag->auto_action);
        $this->assertDatabaseHas('audit_log', ['action' => 'abuse.flag_raised', 'account_id' => $mailbox->domain->user_id]);
        Notification::assertNothingSent();
    }

    public function test_volume_with_bounces_or_complaints_locks_automatically_and_tells_the_owner(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 800, 200, 5);

        $flag = $this->evaluate($mailbox, $hour);

        $this->assertSame('high', $flag->severity);
        $this->assertSame('locked', $mailbox->fresh()->sending_state);
        $this->assertSame('locked', $flag->auto_action);
        $this->assertDatabaseHas('audit_log', ['action' => 'abuse.sending_locked', 'actor_type' => 'system']);
        Notification::assertSentTo($mailbox->domain->user, SendingRestrictedNotification::class);
    }

    public function test_high_volume_alone_is_not_clear_cut_and_is_never_locked(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 800, 0, 0);

        $this->evaluate($mailbox, $hour);

        $this->assertSame('limited', $mailbox->fresh()->sending_state);
    }

    public function test_a_second_run_updates_the_open_flag_instead_of_adding_another(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 100, 25);
        $this->evaluate($mailbox, $hour);
        $this->evaluate($mailbox, $hour);

        $this->assertSame(1, AbuseFlag::query()->count());
        $this->assertSame(1, AuditLog::query()->where('action', 'abuse.flag_raised')->count());
    }

    public function test_the_command_checks_recent_senders(): void
    {
        Notification::fake();
        $mailbox = $this->mailbox();
        $this->sent($mailbox, 100, 25);

        $this->artisan('abuse:evaluate')->assertSuccessful();

        $this->assertSame(1, AbuseFlag::query()->where('mailbox_id', $mailbox->id)->count());
    }

    public function test_support_can_warn_and_clear_but_not_lock(): void
    {
        Notification::fake();
        $flag = AbuseFlag::factory()->create();
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'locked', 'reason' => 'Looks like a purchased list'])->assertForbidden();
        $this->assertSame('open', $flag->fresh()->status);

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'warned', 'reason' => 'Please check your list'])->assertRedirect(route('ops.abuse'));
        $this->assertSame('resolved', $flag->fresh()->status);
        Notification::assertSentTo($flag->mailbox->domain->user, SendingRestrictedNotification::class);
    }

    public function test_an_engineer_can_lock_and_later_unlock_and_both_are_audited(): void
    {
        Notification::fake();
        $flag = AbuseFlag::factory()->create();
        $engineer = Staff::factory()->withTwoFactor()->create(['role' => 'engineer']);
        $this->actingAs($engineer, 'staff');

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'locked', 'reason' => 'Bulk marketing, against the terms'])->assertRedirect();
        $mailbox = $flag->mailbox->fresh();
        $this->assertSame('locked', $mailbox->sending_state);
        $this->assertSame($engineer->id, $flag->fresh()->resolved_by);

        $this->post(route('ops.abuse.unlock', $mailbox->id), ['reason' => 'Owner explained, list cleaned'])->assertRedirect();
        // Unpaid domains rest on the low new-account cap, not full speed.
        $this->assertSame('probation', $mailbox->fresh()->sending_state);
        $this->assertDatabaseHas('audit_log', ['action' => 'abuse.sending_unlocked', 'actor_type' => 'staff', 'actor_id' => $engineer->id]);
    }

    public function test_a_reason_is_required_and_a_resolved_flag_cannot_be_resolved_again(): void
    {
        Notification::fake();
        $flag = AbuseFlag::factory()->create();
        $this->actingAs(Staff::factory()->withTwoFactor()->create(['role' => 'owner']), 'staff');

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'cleared', 'reason' => ''], ['Accept' => 'application/json'])->assertUnprocessable();

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'cleared', 'reason' => 'Quarterly invoice run']);
        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'cleared', 'reason' => 'Quarterly invoice run'])->assertStatus(409);
    }

    public function test_a_customer_cannot_reach_the_abuse_endpoints(): void
    {
        $flag = AbuseFlag::factory()->create();
        $this->actingAs(User::factory()->create(), 'web');

        $this->post(route('ops.abuse.resolve', $flag->id), ['outcome' => 'cleared', 'reason' => 'Trying my luck'])->assertRedirect('/ops/login');
    }

    public function test_the_queue_and_detail_carry_counts_and_no_message_content(): void
    {
        $flag = AbuseFlag::factory()->create();
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $response = $this->get(route('ops.abuse'))->assertInertia(fn (Assert $p) => $p->component('Ops/Abuse')->has('flags', 1)->where('flags.0.id', $flag->id));
        $this->get(route('ops.abuse.show', $flag->id))->assertInertia(fn (Assert $p) => $p->component('Ops/AbuseDetail')->has('detail.series', 24));

        $json = json_encode($response->viewData('page')['props']);
        foreach (['subject', 'body', 'recipient'] as $needle) {
            $this->assertStringNotContainsString('"'.$needle, $json);
        }
    }

    public function test_in_practice_mode_the_bot_records_what_it_would_do_and_changes_nothing(): void
    {
        config(['abuse.mode' => 'dry_run']);
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 800, 200, 5);

        $flag = $this->evaluate($mailbox, $hour);

        $this->assertSame('would_lock', $flag->auto_action);
        $this->assertNotSame('locked', Mailbox::query()->find($mailbox->id)->sending_state);
        Notification::assertNothingSent();
    }

    public function test_the_outbound_filter_share_is_a_rule_and_counts_toward_a_lock(): void
    {
        $mailbox = $this->mailbox();
        $hour = $this->sent($mailbox, 400);
        SendingStat::query()->where('mailbox_id', $mailbox->id)->update(['filter_flagged' => 380]);

        $flag = $this->evaluate($mailbox, $hour);

        $this->assertContains('filter', $flag->rules);
        $this->assertSame('locked', Mailbox::query()->find($mailbox->id)->sending_state);
    }

    public function test_an_exempt_mailbox_is_never_flagged_and_only_an_owner_can_exempt(): void
    {
        $mailbox = $this->mailbox();
        $this->actingAs(Staff::factory()->withTwoFactor()->create(['role' => 'engineer']), 'staff');
        $this->post(route('ops.abuse.exempt', $mailbox->id), ['reason' => 'Newsletter customer'])->assertForbidden();

        $this->actingAs(Staff::factory()->withTwoFactor()->create(['role' => 'owner']), 'staff');
        $this->post(route('ops.abuse.exempt', $mailbox->id), ['reason' => 'Newsletter customer, agreed in writing'])->assertRedirect();

        $hour = $this->sent($mailbox, 800, 200, 5);
        $this->assertNull($this->evaluate($mailbox->fresh(), $hour));
        $this->assertDatabaseHas('audit_log', ['action' => 'abuse.exemption_changed']);
    }

    public function test_a_new_mailbox_on_an_unpaid_domain_starts_on_the_low_cap(): void
    {
        $this->seed(PlanSeeder::class);
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'fresh.com', 'plan' => 'business']);
        $domain = Domain::query()->where('name', 'fresh.com')->firstOrFail();

        $this->post(route('onboarding.mailboxes.store'), ['domain' => $domain->id, 'rows' => [['local_part' => 'hi', 'quota_gb' => 1]]]);

        $this->assertSame('probation', $domain->mailboxes()->first()->sending_state);
    }
}
