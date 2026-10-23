<?php

namespace Tests\Feature;

use App\Identity\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MailSettingsSaveTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_is_sent_to_sign_in(): void
    {
        $this->patch(route('mail.settings.update'), [])->assertRedirect(route('login'));
    }

    public function test_an_unverified_user_is_sent_to_verify(): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->patch(route('mail.settings.update'), [])->assertRedirect(route('verification.notice'));
    }

    public function test_a_verified_user_with_no_mailbox_gets_a_404(): void
    {
        $user = User::factory()->create();
        Domain::factory()->for($user)->withSubscription()->create();

        $this->actingAs($user);

        $this->patch(route('mail.settings.update'), ['display_name' => 'Victory'])->assertNotFound();
    }

    public function test_display_name_and_reply_to_persist_to_the_mailbox_row(): void
    {
        [$user, $mailbox] = $this->seedMailbox();
        $this->actingAs($user);

        $this->patch(route('mail.settings.update'), [
            'display_name' => 'Victory Adaobi',
            'reply_to' => 'replies@adaobifoods.com',
        ])->assertRedirect();

        $mailbox->refresh();
        $this->assertSame('Victory Adaobi', $mailbox->display_name);
        $this->assertSame('replies@adaobifoods.com', $mailbox->settings['reply_to']);
    }

    public function test_signature_and_block_remote_images_write_to_settings_json(): void
    {
        [$user, $mailbox] = $this->seedMailbox();
        $this->actingAs($user);

        $this->patch(route('mail.settings.update'), [
            'signature_text' => "Victory\nAdaobi Foods",
            'signature_on_replies' => true,
            'block_remote_images' => false,
        ])->assertRedirect();

        $mailbox->refresh();
        $this->assertSame("Victory\nAdaobi Foods", $mailbox->settings['signature_text']);
        $this->assertTrue($mailbox->settings['signature_on_replies']);
        $this->assertFalse($mailbox->settings['block_remote_images']);
    }

    public function test_auto_reply_window_persists_as_a_group(): void
    {
        [$user, $mailbox] = $this->seedMailbox();
        $this->actingAs($user);

        $this->patch(route('mail.settings.update'), [
            'auto_reply' => ['on' => true, 'from' => '2026-11-01', 'until' => '2026-11-10'],
        ])->assertRedirect();

        $mailbox->refresh();
        $this->assertSame(['on' => true, 'from' => '2026-11-01', 'until' => '2026-11-10'], $mailbox->settings['auto_reply']);
    }

    public function test_auto_reply_until_must_not_be_before_from(): void
    {
        [$user] = $this->seedMailbox();
        $this->actingAs($user);

        // Browser saves land as Inertia requests, so session errors are the real surface.
        $this->withHeader('X-Inertia', 'true')->patch(route('mail.settings.update'), [
            'auto_reply' => ['on' => true, 'from' => '2026-11-10', 'until' => '2026-11-01'],
        ])->assertSessionHasErrors('auto_reply.until');
    }

    public function test_unknown_fields_are_ignored_so_an_owner_cannot_sneak_quota_through(): void
    {
        [$user, $mailbox] = $this->seedMailbox();
        $this->actingAs($user);
        $before = $mailbox->quota_gb;

        $this->patch(route('mail.settings.update'), [
            'display_name' => 'Legit',
            'quota_gb' => 9999,
            'require_two_factor' => true,
            'state' => 'suspended',
        ])->assertRedirect();

        $mailbox->refresh();
        $this->assertEquals($before, $mailbox->quota_gb);
        $this->assertFalse($mailbox->require_two_factor);
        $this->assertNotSame('suspended', $mailbox->state);
    }

    public function test_a_save_writes_one_audit_row(): void
    {
        [$user] = $this->seedMailbox();
        $this->actingAs($user);

        $this->patch(route('mail.settings.update'), ['display_name' => 'Victory']);

        $log = AuditLog::query()->where('action', AuditAction::MailboxSettingsChanged->value)->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('Settings saved', (string) $log->summary);
    }

    /**
     * @return array{0: User, 1: Mailbox}
     */
    private function seedMailbox(): array
    {
        $user = User::factory()->create();
        $domain = Domain::factory()->for($user)->withSubscription()->create();
        $mailbox = Mailbox::factory()->for($domain)->create();

        return [$user, $mailbox];
    }
}
