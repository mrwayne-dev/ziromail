<?php

namespace Tests\Feature\Identity;

use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationAndVerificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $override = []): array
    {
        return array_merge([
            'business' => 'Adaobi Foods Ltd',
            'email' => 'owner@adaobifoods.test',
            'phone' => '08030000000',
            'password' => 'a-long-enough-passphrase',
            'terms' => true,
        ], $override);
    }

    public function test_registration_creates_an_unverified_account_hashes_the_password_and_sends_the_link(): void
    {
        Notification::fake();

        $this->from('/signup')->post(route('register'), $this->payload())->assertRedirect(route('verification.notice'));

        $user = User::query()->where('email', 'owner@adaobifoods.test')->sole();
        $this->assertNull($user->email_verified_at);
        $this->assertNotSame('a-long-enough-passphrase', $user->password);
        $this->assertTrue(password_verify('a-long-enough-passphrase', $user->password) || \Hash::check('a-long-enough-passphrase', $user->password));
        $this->assertSame('Adaobi Foods Ltd', $user->business_name);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertGuest();
        Notification::assertSentTo($user, VerificationCodeNotification::class);
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.registered']);
    }

    public function test_registering_an_existing_address_looks_identical_and_emails_the_owner(): void
    {
        Notification::fake();
        $existing = User::factory()->create(['email' => 'owner@adaobifoods.test']);

        $new = $this->post(route('register'), $this->payload(['email' => 'fresh@adaobifoods.test']));
        $dup = $this->post(route('register'), $this->payload());

        $this->assertSame($new->getStatusCode(), $dup->getStatusCode());
        $this->assertSame($new->headers->get('Location'), $dup->headers->get('Location'));
        $this->assertSame(1, User::query()->where('email', 'owner@adaobifoods.test')->count());
        $this->assertSame('owner@adaobifoods.test', session('verification.pending_email'));
        Notification::assertSentTo($existing, AccountSecurityNotification::class);
        Notification::assertNotSentTo($existing, VerificationCodeNotification::class);
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.registration_attempt_on_existing']);
    }

    public function test_the_registration_validation_errors_do_not_mention_existence(): void
    {
        User::factory()->create(['email' => 'owner@adaobifoods.test']);

        $this->withHeaders(['X-Inertia' => 'true'])->from('/signup')->post(route('register'), $this->payload(['terms' => false]))
            ->assertSessionHasErrors('terms')->assertSessionDoesntHaveErrors('email');
    }

    public function test_the_registration_allow_list_closes_the_preview_to_strangers(): void
    {
        config(['identity.registration.allowlist' => ['@team.test', 'boss@elsewhere.test']]);

        $this->post(route('register'), $this->payload(['email' => 'stranger@gmail.test']))->assertSessionHasErrors('email');
        $this->assertDatabaseCount('users', 0);

        $this->post(route('register'), $this->payload(['email' => 'amaka@team.test']))->assertRedirect(route('verification.notice'));
        $this->post(route('register'), $this->payload(['email' => 'boss@elsewhere.test']))->assertRedirect(route('verification.notice'));
        $this->assertDatabaseCount('users', 2);
    }

    public function test_registration_is_rate_limited_per_ip(): void
    {
        Notification::fake();

        foreach (range(1, config('identity.register_limits.per_hour_ip')) as $i) {
            $this->postJson(route('register'), $this->payload(['email' => "user{$i}@x.test"]))->assertRedirect();
        }

        $this->postJson(route('register'), $this->payload(['email' => 'one-more@x.test']))->assertStatus(429);
    }

    public function test_a_weak_or_short_password_is_refused(): void
    {
        $this->withHeaders(['X-Inertia' => 'true'])->post(route('register'), $this->payload(['password' => 'short']))->assertSessionHasErrors('password');
        $this->assertDatabaseCount('users', 0);
    }

    private function issueCode(User $user): string
    {
        Notification::fake();
        $user->sendEmailVerificationNotification();
        $code = null;
        Notification::assertSentTo($user, VerificationCodeNotification::class, function (VerificationCodeNotification $notification) use (&$code) {
            $code = $notification->code;

            return true;
        });

        return $code;
    }

    public function test_the_code_is_six_digits_stored_only_as_a_hash_and_confirms_the_address(): void
    {
        $user = User::factory()->unverified()->create();
        $code = $this->issueCode($user);

        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
        $this->assertNotSame($code, $user->fresh()->verification_code_hash);
        $this->assertStringNotContainsString($code, (string) $user->fresh()->verification_code_hash);

        $this->withSession(['verification.pending_email' => $user->email])->post(route('verification.confirm'), ['code' => $code])
            ->assertRedirect(route('login'));

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNull($user->fresh()->verification_code_hash);
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.email_verified']);
    }

    public function test_a_code_works_once_and_not_after_it_expires(): void
    {
        $user = User::factory()->unverified()->create();
        $code = $this->issueCode($user);
        $session = ['verification.pending_email' => $user->email];

        $this->travel(config('identity.verification.code_minutes') + 1)->minutes();
        $this->withSession($session)->post(route('verification.confirm'), ['code' => $code])->assertSessionHasErrors('code');
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_five_wrong_guesses_kill_the_code_even_if_the_next_one_is_right(): void
    {
        $user = User::factory()->unverified()->create();
        $code = $this->issueCode($user);
        $wrong = $code === '000000' ? '111111' : '000000';
        $session = ['verification.pending_email' => $user->email];

        foreach (range(1, config('identity.verification.code_max_attempts')) as $ignored) {
            $this->withSession($session)->post(route('verification.confirm'), ['code' => $wrong])->assertSessionHasErrors('code');
        }

        $this->withSession($session)->post(route('verification.confirm'), ['code' => $code])->assertSessionHasErrors('code');
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_every_failure_reads_the_same_and_an_unknown_address_cannot_be_told_apart(): void
    {
        $user = User::factory()->unverified()->create();
        $this->issueCode($user);

        $wrong = $this->withSession(['verification.pending_email' => $user->email])->post(route('verification.confirm'), ['code' => '123456']);
        $unknown = $this->withSession(['verification.pending_email' => 'nobody@x.test'])->post(route('verification.confirm'), ['code' => '123456']);

        $wrong->assertSessionHasErrors(['code' => 'That code is not right, or it has expired. Check the latest email or send a new one.']);
        $unknown->assertSessionHasErrors(['code' => 'That code is not right, or it has expired. Check the latest email or send a new one.']);
    }

    public function test_confirming_is_rate_limited_per_address(): void
    {
        $user = User::factory()->unverified()->create();
        $this->issueCode($user);
        $session = ['verification.pending_email' => $user->email];

        foreach (range(1, config('identity.verification.confirm_per_15_minutes')) as $ignored) {
            $this->withSession($session)->post(route('verification.confirm'), ['code' => '123456']);
        }

        $this->withSession($session)->post(route('verification.confirm'), ['code' => '123456'])
            ->assertSessionHasErrors(['code' => 'Too many attempts. Wait a few minutes, then try again.']);
    }

    public function test_a_new_code_replaces_the_old_one(): void
    {
        $user = User::factory()->unverified()->create();
        $first = $this->issueCode($user);
        $second = $this->issueCode($user);

        $session = ['verification.pending_email' => $user->email];
        if ($first !== $second) {
            $this->withSession($session)->post(route('verification.confirm'), ['code' => $first])->assertSessionHasErrors('code');
        }
        $this->withSession($session)->post(route('verification.confirm'), ['code' => $second])->assertRedirect(route('login'));
    }

    public function test_the_code_email_carries_the_code_and_is_not_queued(): void
    {
        $user = User::factory()->unverified()->create();
        $code = $this->issueCode($user);

        $mail = (new VerificationCodeNotification($code, 15))->toMail($user);

        $this->assertStringContainsString($code, $mail->subject);
        $this->assertContains("**{$code}**", $mail->introLines);
        $this->assertNotInstanceOf(ShouldQueue::class, new VerificationCodeNotification($code, 15));
    }

    public function test_an_unverified_user_is_held_at_the_verify_screen(): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->get('/checkout')->assertRedirect(route('verification.notice'));
    }

    public function test_resend_is_throttled_and_answers_the_same_for_unknown_and_known_addresses(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create(['email' => 'known@x.test']);

        $this->withSession(['verification.pending_email' => 'known@x.test'])->post(route('verification.send'))->assertSessionHas('status', 'sent');
        Notification::assertSentToTimes($user, VerificationCodeNotification::class, 1);

        // A second request inside a minute is held back with a neutral message.
        $this->withSession(['verification.pending_email' => 'known@x.test'])->post(route('verification.send'))
            ->assertSessionHas('status', 'Please wait a minute before asking for another code.');
        Notification::assertSentToTimes($user, VerificationCodeNotification::class, 1);

        $unknown = $this->withSession(['verification.pending_email' => 'nobody@x.test'])->post(route('verification.send'));
        $unknown->assertSessionHas('status', 'sent');
        $this->assertSame(1, AuditLog::query()->where('action', 'auth.email_verification_sent')->count());
    }
}
