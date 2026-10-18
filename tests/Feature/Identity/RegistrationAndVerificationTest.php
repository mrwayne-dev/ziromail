<?php

namespace Tests\Feature\Identity;

use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
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
        Notification::assertSentTo($user, VerifyEmail::class);
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
        Notification::assertNotSentTo($existing, VerifyEmail::class);
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

    private function link(User $user, ?int $minutes = null, ?string $hash = null): string
    {
        return URL::temporarySignedRoute('verification.verify', now()->addMinutes($minutes ?? config('auth.verification.expire')), [
            'id' => $user->getKey(),
            'hash' => $hash ?? sha1($user->getEmailForVerification()),
        ]);
    }

    public function test_the_signed_link_verifies_without_a_session_and_expires_after_24_hours(): void
    {
        $this->assertSame(1440, config('auth.verification.expire'));
        $user = User::factory()->unverified()->create();

        $this->get($this->link($user))->assertRedirect(route('login'));

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertGuest();
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.email_verified']);
    }

    public function test_an_expired_tampered_or_unknown_link_all_end_in_the_same_place(): void
    {
        $user = User::factory()->unverified()->create();

        $expired = $this->link($user, -5);
        $tampered = $this->link($user, hash: sha1('someone-else@x.test'));
        $unknown = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => 9999, 'hash' => sha1('x')]);
        $unsigned = route('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]);

        foreach ([$expired, $tampered, $unknown, $unsigned] as $url) {
            $this->get($url)->assertRedirect(route('verification.notice'))->assertSessionHas('verification_state', 'expired');
        }

        $this->assertNull($user->fresh()->email_verified_at);
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
        Notification::assertSentToTimes($user, VerifyEmail::class, 1);

        // A second request inside a minute is held back with a neutral message.
        $this->withSession(['verification.pending_email' => 'known@x.test'])->post(route('verification.send'))
            ->assertSessionHas('status', 'Please wait a minute before asking for another link.');
        Notification::assertSentToTimes($user, VerifyEmail::class, 1);

        $unknown = $this->withSession(['verification.pending_email' => 'nobody@x.test'])->post(route('verification.send'));
        $unknown->assertSessionHas('status', 'sent');
        $this->assertSame(1, AuditLog::query()->where('action', 'auth.email_verification_sent')->count());
    }
}
