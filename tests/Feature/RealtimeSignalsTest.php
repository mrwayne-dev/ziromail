<?php

namespace Tests\Feature;

use App\Events\AccountChanged;
use App\Events\OpsChanged;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\SendingStat;
use App\Models\Staff;
use App\Models\User;
use App\Services\Abuse\AbuseEvaluator;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * The socket itself is not run in the test suite. These tests confirm that state changes dispatch
 * the signal and that the private channels refuse the wrong account. The reload the browser does
 * on each signal goes through the ordinary Inertia request, which is covered by the other tests.
 */
class RealtimeSignalsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        Event::fake([AccountChanged::class, OpsChanged::class]);
    }

    public function test_adding_a_domain_signals_the_account_and_the_console(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'signal.com', 'plan' => 'business']);

        Event::assertDispatched(AccountChanged::class, fn (AccountChanged $event) => $event->accountId === $user->id && $event->category === 'domain');
        Event::assertDispatched(OpsChanged::class, fn (OpsChanged $event) => $event->category === 'users');
    }

    public function test_creating_a_mailbox_signals_both_channels(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'mb.com', 'plan' => 'business']);
        $domain = Domain::query()->where('name', 'mb.com')->firstOrFail();

        $this->post(route('onboarding.mailboxes.store'), ['domain' => $domain->id, 'rows' => [['local_part' => 'hi', 'quota_gb' => 1]]]);

        Event::assertDispatched(AccountChanged::class, fn (AccountChanged $event) => $event->category === 'mailbox');
        Event::assertDispatched(OpsChanged::class, fn (OpsChanged $event) => $event->category === 'mailboxes');
    }

    public function test_an_abuse_flag_signals_both_channels(): void
    {
        config(['abuse.mode' => 'live']);
        $owner = User::factory()->create();
        $mailbox = Mailbox::factory()->for(Domain::factory()->for($owner, 'user'))->create();
        $stat = new SendingStat(['hour' => now()->startOfHour(), 'sent' => 400, 'bounced' => 100, 'complaints' => 2]);
        $stat->mailbox_id = $mailbox->id;
        $stat->save();

        app(AbuseEvaluator::class)->evaluate($mailbox->load('domain.user'), now());

        Event::assertDispatched(AccountChanged::class, fn (AccountChanged $event) => $event->accountId === $owner->id && $event->category === 'security');
        Event::assertDispatched(OpsChanged::class, fn (OpsChanged $event) => $event->category === 'abuse');
    }

    public function test_the_mail_events_endpoint_signals_the_console_once_per_request(): void
    {
        config(['ziroemail.mail_events_secret' => 'sec']);
        $mailbox = Mailbox::factory()->for(Domain::factory()->create(['name' => 'relay.com']))->create(['local_part' => 'hi']);
        $hour = now()->startOfHour()->toIso8601String();
        $body = json_encode(['sending' => [
            ['mailbox' => 'hi@relay.com', 'hour' => $hour, 'sent' => 1, 'bounced' => 0, 'complaints' => 0],
            ['mailbox' => 'hi@relay.com', 'hour' => $hour, 'sent' => 2, 'bounced' => 0, 'complaints' => 0],
        ]]);
        $ts = (string) time();

        $this->call('POST', '/api/mail-events', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_ZIRO_TIMESTAMP' => $ts, 'HTTP_X_ZIRO_SIGNATURE' => hash_hmac('sha256', $ts.'.'.$body, 'sec'),
        ], $body)->assertOk();

        Event::assertDispatchedTimes(OpsChanged::class, 1);
    }

    public function test_an_owner_can_subscribe_to_their_own_account_channel_and_nobody_else_can(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $this->assertTrue($this->accountChannelOpens($user, (int) $user->id));
        $this->assertFalse($this->accountChannelOpens($other, (int) $user->id));
    }

    public function test_the_mailbox_channel_only_opens_for_the_owning_account(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $mailbox = Mailbox::factory()->for(Domain::factory()->for($owner, 'user'))->create();

        $this->assertTrue($this->mailboxChannelOpens($owner, $mailbox->id));
        $this->assertFalse($this->mailboxChannelOpens($other, $mailbox->id));
    }

    public function test_the_ops_channel_is_staff_only(): void
    {
        $staff = Staff::factory()->withTwoFactor()->create();
        $this->actingAs($staff, 'staff');

        $this->postJson('/broadcasting/auth', ['channel_name' => 'private-ops', 'socket_id' => '1.1'])->assertStatus(200);
    }

    public function test_a_customer_session_cannot_open_the_ops_channel(): void
    {
        $this->actingAs(User::factory()->create(), 'web');
        $this->postJson('/broadcasting/auth', ['channel_name' => 'private-ops', 'socket_id' => '1.1'])->assertStatus(403);
    }

    private function accountChannelOpens(User $actor, int $ownerId): bool
    {
        $this->actingAs($actor, 'web');

        return $this->postJson('/broadcasting/auth', ['channel_name' => 'private-account.'.$ownerId, 'socket_id' => '1.1'])->status() === 200;
    }

    private function mailboxChannelOpens(User $actor, string $mailboxId): bool
    {
        $this->actingAs($actor, 'web');

        return $this->postJson('/broadcasting/auth', ['channel_name' => 'private-mailbox.'.$mailboxId, 'socket_id' => '1.1'])->status() === 200;
    }
}
