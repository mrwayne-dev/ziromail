<?php

namespace Tests\Feature;

use App\Models\DeliveryStat;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\SendingStat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class MailEventsTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-secret-value';

    protected function setUp(): void
    {
        parent::setUp();
        config(['ziroemail.mail_events_secret' => self::SECRET]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function report(array $payload, ?string $secret = self::SECRET, ?int $timestamp = null): TestResponse
    {
        $body = json_encode($payload);
        $timestamp ??= time();

        return $this->call('POST', '/api/mail-events', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_ZIRO_TIMESTAMP' => (string) $timestamp,
            'HTTP_X_ZIRO_SIGNATURE' => hash_hmac('sha256', $timestamp.'.'.$body, (string) $secret),
        ], $body);
    }

    private function mailbox(): Mailbox
    {
        return Mailbox::factory()->for(Domain::factory()->state(['name' => 'acme.com']))->create(['local_part' => 'sales']);
    }

    public function test_a_signed_report_stores_counts_and_a_resend_replaces_them(): void
    {
        $mailbox = $this->mailbox();
        $hour = now()->startOfHour()->toIso8601String();
        $payload = ['sending' => [['mailbox' => 'Sales@acme.com', 'hour' => $hour, 'sent' => 40, 'bounced' => 2, 'complaints' => 0]]];

        $this->report($payload)->assertOk()->assertJson(['accepted' => 1, 'skipped' => 0]);
        $payload['sending'][0]['sent'] = 55;
        $this->report($payload)->assertOk();

        $this->assertSame(1, SendingStat::query()->where('mailbox_id', $mailbox->id)->count());
        $this->assertSame(55, SendingStat::query()->first()->sent);
    }

    public function test_delivery_counts_are_stored_per_domain_and_provider(): void
    {
        $this->mailbox();

        $this->report(['delivery' => [['domain' => 'acme.com', 'recipient_domain' => 'Gmail.com', 'hour' => now()->toIso8601String(), 'delivered' => 90, 'deferred' => 5, 'bounced' => 3, 'rejected' => 2, 'reply_code' => '451 4.3.2']]])->assertOk();

        $this->assertDatabaseHas('delivery_stats', ['recipient_domain' => 'gmail.com', 'delivered' => 90, 'reply_code' => '451 4.3.2']);
        $this->assertSame(1, DeliveryStat::query()->count());
    }

    public function test_unknown_mailboxes_and_stale_hours_are_skipped_not_created(): void
    {
        $this->mailbox();
        $row = ['mailbox' => 'sales@acme.com', 'sent' => 1, 'bounced' => 0, 'complaints' => 0];

        $this->report(['sending' => [
            [...$row, 'mailbox' => 'ghost@acme.com', 'hour' => now()->toIso8601String()],
            [...$row, 'hour' => now()->subDays(10)->toIso8601String()],
            [...$row, 'hour' => now()->addDay()->toIso8601String()],
        ]])->assertOk()->assertJson(['accepted' => 0, 'skipped' => 3]);

        $this->assertSame(0, SendingStat::query()->count());
    }

    public function test_a_wrong_stale_or_missing_signature_is_refused_the_same_way(): void
    {
        $payload = ['sending' => []];

        $this->report($payload, 'wrong-secret')->assertUnauthorized();
        $this->report($payload, self::SECRET, time() - 3600)->assertUnauthorized();
        $this->postJson('/api/mail-events', $payload)->assertUnauthorized();
    }

    public function test_with_no_secret_configured_the_endpoint_is_closed(): void
    {
        config(['ziroemail.mail_events_secret' => '']);

        $this->report(['sending' => []], '')->assertStatus(503);
    }

    public function test_invalid_counts_are_rejected(): void
    {
        $this->mailbox();

        $this->report(['sending' => [['mailbox' => 'sales@acme.com', 'hour' => now()->toIso8601String(), 'sent' => -5, 'bounced' => 0, 'complaints' => 0]]])->assertStatus(422);
    }
}
