<?php

namespace Tests\Feature\Identity;

use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private const FAILURE = 'That email and password do not match.';

    private function user(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['email' => 'owner@adaobifoods.test', 'password' => 'correct horse battery'], $attributes));
    }

    private function attempt(string $email, string $password, ?string $ip = null, bool $json = false)
    {
        $request = $ip ? $this->withServerVariables(['REMOTE_ADDR' => $ip]) : $this;

        return $json
            ? $request->postJson(route('login.store'), ['email' => $email, 'password' => $password])
            : $request->from('/login')->post(route('login.store'), ['email' => $email, 'password' => $password]);
    }

    public function test_a_verified_user_signs_in_and_the_session_id_changes(): void
    {
        $this->user();
        $this->get('/login');
        $before = session()->getId();

        $this->attempt('owner@adaobifoods.test', 'correct horse battery')->assertRedirect();

        $this->assertAuthenticated();
        $this->assertNotSame($before, session()->getId(), 'The session id must be regenerated on sign in.');
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.login_succeeded']);
    }

    public function test_the_first_ever_sign_in_goes_to_onboarding_with_the_chosen_plan(): void
    {
        $this->user();

        $this->withSession(['signup.plan' => 'business'])->attempt('owner@adaobifoods.test', 'correct horse battery')
            ->assertRedirect(route('onboarding.domain', ['plan' => 'business']));
    }

    public function test_a_wrong_password_and_an_unknown_email_get_the_same_response(): void
    {
        $this->user();

        $wrong = $this->attempt('owner@adaobifoods.test', 'nope-nope-nope');
        $unknown = $this->attempt('nobody@adaobifoods.test', 'nope-nope-nope');

        $this->assertSame($wrong->getStatusCode(), $unknown->getStatusCode());
        $this->assertSame($wrong->headers->get('Location'), $unknown->headers->get('Location'));
        $wrong->assertSessionHasErrors(['email' => self::FAILURE]);
        $unknown->assertSessionHasErrors(['email' => self::FAILURE]);
        $this->assertGuest();

        $this->assertDatabaseCount('audit_log', 2);
    }

    public function test_a_hash_check_runs_even_when_the_account_does_not_exist(): void
    {
        $this->user();
        $calls = 0;
        Hash::partialMock()->shouldReceive('check')->andReturnUsing(function (...$args) use (&$calls) {
            $calls++;

            return false;
        });

        $this->attempt('nobody@adaobifoods.test', 'whatever-password');
        $this->assertSame(1, $calls);

        $this->attempt('owner@adaobifoods.test', 'whatever-password');
        $this->assertSame(2, $calls);
    }

    public function test_unknown_emails_are_never_stored_raw_in_the_audit_log(): void
    {
        $this->attempt('typo-with-password-hunter2@x.test', 'nope-nope-nope');

        $row = AuditLog::query()->sole();
        $this->assertStringNotContainsString('hunter2', json_encode($row->toArray()));
        $this->assertSame(64, strlen($row->metadata['email_hash']));
    }

    public function test_five_failures_start_a_cooldown_that_doubles_up_to_fifteen_minutes(): void
    {
        $this->user();

        foreach (range(1, 5) as $i) {
            $this->attempt('owner@adaobifoods.test', 'bad-password', json: true)->assertRedirect()->assertSessionHasErrors('email');
        }

        $first = $this->attempt('owner@adaobifoods.test', 'correct horse battery', json: true);
        $first->assertStatus(429)->assertHeader('Retry-After');
        $this->assertLessThanOrEqual(60, (int) $first->headers->get('Retry-After'));

        // After the first minute the next failure doubles the wait (1, 2, 4, 8, then a 15 minute cap).
        $waits = [];
        foreach ([2, 4, 8, 15, 15] as $expected) {
            $this->travel(61 + (end($waits) ?: 0))->seconds();
            $this->attempt('owner@adaobifoods.test', 'bad-password', json: true)->assertRedirect()->assertSessionHasErrors('email');
            $res = $this->attempt('owner@adaobifoods.test', 'correct horse battery', json: true)->assertStatus(429);
            $waits[] = (int) $res->headers->get('Retry-After');
            $this->assertEqualsWithDelta($expected * 60, end($waits), 2);
        }
    }

    public function test_a_success_clears_the_cooldown_counter(): void
    {
        $this->user();

        foreach (range(1, 3) as $i) {
            $this->attempt('owner@adaobifoods.test', 'bad-password', json: true);
        }
        $this->attempt('owner@adaobifoods.test', 'correct horse battery', json: true)->assertRedirect();
        $this->post('/logout');

        foreach (range(1, 4) as $i) {
            $this->attempt('owner@adaobifoods.test', 'bad-password', json: true)->assertRedirect()->assertSessionHasErrors('email');
        }
        $this->attempt('owner@adaobifoods.test', 'correct horse battery', json: true)->assertRedirect();
    }

    public function test_one_ip_is_limited_to_thirty_attempts_a_minute_across_emails(): void
    {
        foreach (range(1, config('identity.login.per_minute_ip')) as $i) {
            $this->attempt("user{$i}@x.test", 'bad-password', '10.9.9.9', json: true)->assertRedirect()->assertSessionHasErrors('email');
        }

        $this->attempt('another@x.test', 'bad-password', '10.9.9.9', json: true)->assertStatus(429);
    }

    public function test_the_distributed_hold_refuses_strangers_but_not_the_owners_own_ip(): void
    {
        Notification::fake();
        $user = $this->user();

        // The owner signs in from home once, so that IP is familiar.
        $this->attempt('owner@adaobifoods.test', 'correct horse battery', '102.0.0.1', json: true)->assertRedirect();
        $this->post('/logout');

        // Twenty failures from twenty different addresses trip the hold.
        foreach (range(1, config('identity.login.distributed_failures_per_hour')) as $i) {
            $this->attempt('owner@adaobifoods.test', 'bad-password', "198.51.100.{$i}", json: true)->assertRedirect()->assertSessionHasErrors('email');
        }

        $this->attempt('owner@adaobifoods.test', 'correct horse battery', '203.0.113.50', json: true)->assertStatus(429);
        $this->attempt('owner@adaobifoods.test', 'correct horse battery', '102.0.0.1', json: true)->assertRedirect();
        Notification::assertSentTo($user, AccountSecurityNotification::class);
    }

    public function test_the_distributed_hold_looks_the_same_for_an_unknown_email(): void
    {
        foreach (range(1, config('identity.login.distributed_failures_per_hour')) as $i) {
            $this->attempt('ghost@x.test', 'bad-password', "198.51.100.{$i}", json: true)->assertRedirect()->assertSessionHasErrors('email');
        }

        $this->attempt('ghost@x.test', 'whatever-password', '203.0.113.50', json: true)->assertStatus(429);
    }

    public function test_signing_in_after_repeated_failures_tells_the_owner(): void
    {
        Notification::fake();
        $user = $this->user();

        foreach (range(1, 4) as $i) {
            $this->attempt('owner@adaobifoods.test', 'bad-password', json: true);
        }
        $this->travel(2)->minutes();
        $this->attempt('owner@adaobifoods.test', 'bad-password', json: true);
        $this->travel(3)->minutes();
        $this->attempt('owner@adaobifoods.test', 'correct horse battery', json: true)->assertRedirect();

        Notification::assertSentTo($user, AccountSecurityNotification::class, fn ($n) => str_contains($n->subject, 'succeeded after failed'));
    }

    public function test_sign_out_ends_the_session_and_regenerates_the_token(): void
    {
        $this->user();
        $this->attempt('owner@adaobifoods.test', 'correct horse battery');
        $token = csrf_token();

        $this->post('/logout')->assertRedirect(route('login'));

        $this->assertGuest();
        $this->assertNotSame($token, csrf_token());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.logout']);
    }

    public function test_sign_out_is_post_only(): void
    {
        $this->actingAs($this->user());

        $this->get('/logout')->assertStatus(405);
        $this->assertAuthenticated();
    }

    public function test_a_signed_in_user_is_redirected_away_from_the_sign_in_page(): void
    {
        $this->actingAs($this->user());

        $this->get('/login')->assertRedirect(route('dashboard'));
    }

    public function test_the_shared_auth_prop_carries_no_secret(): void
    {
        $this->actingAs($this->user());

        $response = $this->get('/checkout');
        $props = $response->viewData('page')['props'];

        $this->assertSame(['id', 'ownerId', 'name', 'email', 'emailVerified', 'twoFactorEnabled', 'recoveryCodesUnused', 'snoozedUntil'], array_keys($props['auth']['user']));
        $json = json_encode($props);
        $this->assertDoesNotMatchRegularExpression('/"(password|remember_token|two_factor_secret|recovery_codes?|token)"/i', $json);
    }

    public function test_the_session_cookie_is_http_only_secure_and_lax(): void
    {
        config(['session.secure' => true, 'session.http_only' => true, 'session.same_site' => 'lax']);

        $response = $this->get('https://ziroemail.test/login');
        $cookie = collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === config('session.cookie'));

        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertTrue($cookie->isSecure());
        $this->assertSame('lax', $cookie->getSameSite());
    }

    public function test_an_unverified_user_can_sign_in_but_is_held_at_the_verify_screen(): void
    {
        $this->user(['email_verified_at' => null]);

        $this->attempt('owner@adaobifoods.test', 'correct horse battery')->assertRedirect();
        $this->assertAuthenticated();
        $this->get('/checkout')->assertRedirect(route('verification.notice'));
    }
}
