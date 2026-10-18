<?php

namespace Tests\Feature\Identity;

use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['email' => 'owner@adaobifoods.test', 'password' => 'correct horse battery']);
    }

    public function test_the_reset_request_answers_the_same_for_every_address(): void
    {
        Notification::fake();
        $user = $this->user();

        $known = $this->from('/forgot-password')->post(route('password.email'), ['email' => 'owner@adaobifoods.test']);
        $unknown = $this->from('/forgot-password')->post(route('password.email'), ['email' => 'nobody@adaobifoods.test']);

        $this->assertSame($known->getStatusCode(), $unknown->getStatusCode());
        $this->assertSame($known->headers->get('Location'), $unknown->headers->get('Location'));
        $known->assertSessionHas('status', 'reset-link-sent');
        $unknown->assertSessionHas('status', 'reset-link-sent');
        Notification::assertSentToTimes($user, ResetPassword::class, 1);
        Notification::assertSentTimes(ResetPassword::class, 1);
    }

    public function test_a_throttled_request_still_answers_the_same_and_sends_nothing(): void
    {
        Notification::fake();
        $user = $this->user();

        foreach (range(1, config('identity.reset.request_per_hour_email') + 2) as $i) {
            $this->travel(61)->seconds();
            $this->post(route('password.email'), ['email' => 'owner@adaobifoods.test'])->assertSessionHas('status', 'reset-link-sent');
        }

        Notification::assertSentToTimes($user, ResetPassword::class, config('identity.reset.request_per_hour_email'));
    }

    public function test_the_stored_token_is_a_hash_and_the_expiry_is_thirty_minutes(): void
    {
        $this->assertSame(30, config('auth.passwords.users.expire'));
        $user = $this->user();

        $token = Password::createToken($user);

        $stored = DB::table('password_reset_tokens')->where('email', $user->email)->value('token');
        $this->assertNotSame($token, $stored);
        $this->assertTrue(Hash::check($token, $stored));
    }

    private function reset(string $token, string $password = 'a brand new long passphrase')
    {
        return $this->from('/reset-password/x')->post(route('password.store'), [
            'token' => $token, 'email' => 'owner@adaobifoods.test', 'password' => $password, 'password_confirmation' => $password,
        ]);
    }

    public function test_a_reset_changes_the_password_ends_every_session_and_does_not_sign_in(): void
    {
        Notification::fake();
        $user = $this->user();
        $oldRemember = $user->remember_token;
        DB::table('sessions')->insert([
            ['id' => 'abc', 'user_id' => $user->id, 'ip_address' => '1.1.1.1', 'user_agent' => 'x', 'payload' => 'x', 'last_activity' => time()],
            ['id' => 'def', 'user_id' => $user->id, 'ip_address' => '2.2.2.2', 'user_agent' => 'y', 'payload' => 'y', 'last_activity' => time()],
        ]);
        $token = Password::createToken($user);

        $this->reset($token)->assertRedirect(route('login'))->assertSessionHas('status');

        $fresh = $user->fresh();
        $this->assertTrue(Hash::check('a brand new long passphrase', $fresh->password));
        $this->assertNotSame($oldRemember, $fresh->remember_token);
        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->id)->count());
        $this->assertGuest();
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.password_reset_completed']);
        Notification::assertSentTo($user, AccountSecurityNotification::class);
    }

    public function test_a_token_works_once(): void
    {
        $token = Password::createToken($this->user());

        $this->reset($token)->assertRedirect(route('login'));
        $this->reset($token, 'yet another long passphrase')->assertSessionHasErrors('email');
    }

    public function test_a_token_expires_after_thirty_minutes(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->travel(31)->minutes();

        $this->reset($token)->assertSessionHasErrors(['email' => 'This link is invalid or has expired. Ask for a new one.']);
        $this->assertTrue(Hash::check('correct horse battery', $user->fresh()->password));
    }

    public function test_a_newer_token_invalidates_the_older_one(): void
    {
        $user = $this->user();
        $first = Password::createToken($user);
        $second = Password::createToken($user);

        $this->assertSame(1, DB::table('password_reset_tokens')->where('email', $user->email)->count());
        $this->reset($first)->assertSessionHasErrors('email');
        $this->reset($second)->assertRedirect(route('login'));
    }

    public function test_a_wrong_token_and_an_unknown_address_read_the_same(): void
    {
        $this->user();

        $wrong = $this->reset('not-a-token');
        $unknown = $this->from('/reset-password/x')->post(route('password.store'), [
            'token' => 'not-a-token', 'email' => 'nobody@x.test', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase',
        ]);

        $wrong->assertSessionHasErrors(['email' => 'This link is invalid or has expired. Ask for a new one.']);
        $unknown->assertSessionHasErrors(['email' => 'This link is invalid or has expired. Ask for a new one.']);
    }

    public function test_the_reset_link_page_is_not_cached_and_sends_no_referrer(): void
    {
        $this->get('/reset-password/some-token?email=owner@adaobifoods.test')
            ->assertOk()
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_reset_submissions_are_rate_limited(): void
    {
        $this->user();

        foreach (range(1, config('identity.reset.submit_per_minute_ip')) as $i) {
            $this->reset('bad-token')->assertSessionHasErrors('email');
        }

        $this->reset('bad-token')->assertSessionHasErrors(['email' => 'Too many attempts. Try again in a few minutes.']);
    }

    public function test_changing_the_password_needs_a_recent_confirmation(): void
    {
        $this->actingAs($this->user());

        $this->post(route('user-password.update'), ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertRedirect(route('password.confirm'));

        $this->post(route('password.confirm.store'), ['password' => 'correct horse battery'])->assertRedirect();
        $this->from('/dashboard')->post(route('user-password.update'), ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertSessionHas('status');
    }

    public function test_a_confirmation_lasts_fifteen_minutes(): void
    {
        $this->assertSame(900, config('auth.password_timeout'));
        $this->actingAs($this->user());
        $payload = ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'];

        $this->post(route('password.confirm.store'), ['password' => 'correct horse battery']);
        $this->travel(14)->minutes();
        $this->from('/dashboard')->post(route('user-password.update'), $payload)->assertSessionHas('status');
        $this->actingAs(User::query()->first());

        $this->travel(2)->minutes();
        $this->post(route('user-password.update'), $payload + [])->assertRedirect(route('password.confirm'));
    }

    public function test_a_password_change_needs_the_current_password_ends_other_sessions_and_notifies(): void
    {
        Notification::fake();
        $user = $this->user();
        $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
        DB::table('sessions')->insert(['id' => 'other', 'user_id' => $user->id, 'ip_address' => '9.9.9.9', 'user_agent' => 'z', 'payload' => 'z', 'last_activity' => time()]);

        $this->withHeaders(['X-Inertia' => 'true'])->from('/dashboard')->post(route('user-password.update'), ['current_password' => 'wrong-wrong-wrong', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertSessionHasErrors(['current_password' => 'That is not your current password.']);
        $this->assertTrue(Hash::check('correct horse battery', $user->fresh()->password));

        $this->from('/dashboard')->post(route('user-password.update'), ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertSessionHas('status');

        $this->assertTrue(Hash::check('a brand new long passphrase', $user->fresh()->password));
        $this->assertSame(0, DB::table('sessions')->where('id', 'other')->count());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.password_changed']);
        Notification::assertSentTo($user, AccountSecurityNotification::class);
    }

    public function test_wrong_confirmations_are_throttled_and_ten_a_hour_sign_the_user_out(): void
    {
        $this->actingAs($this->user());

        foreach (range(1, 5) as $i) {
            $this->post(route('password.confirm.store'), ['password' => 'nope-nope-nope'])->assertSessionHasErrors(['password' => 'That password is not right.']);
        }
        $this->post(route('password.confirm.store'), ['password' => 'nope-nope-nope'])->assertSessionHasErrors(['password' => 'Too many attempts. Wait a minute and try again.']);

        foreach (range(1, 5) as $i) {
            $this->travel(61)->seconds();
            $last = $this->post(route('password.confirm.store'), ['password' => 'nope-nope-nope']);
        }
        $last->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertDatabaseCount('audit_log', 10);
    }
}
