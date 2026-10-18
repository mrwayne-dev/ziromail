<?php

namespace Tests\Feature\Identity;

use App\Identity\Services\RecoveryCodeService;
use App\Models\TwoFactorRecoveryCode;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

    private function otp(string $secret = self::SECRET, ?int $offsetSteps = 0): string
    {
        return (new Google2FA)->getCurrentOtp($secret);
    }

    private function user(bool $twoFactor = false): User
    {
        $factory = User::factory();
        if ($twoFactor) {
            $factory = $factory->withTwoFactor();
        }

        return $factory->create(['email' => 'owner@adaobifoods.test', 'password' => 'correct horse battery']);
    }

    private function signedIn(User $user): static
    {
        return $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    }

    public function test_no_route_reads_a_secret_or_a_recovery_code(): void
    {
        foreach (Route::getRoutes()->getRoutes() as $route) {
            if (str_starts_with($route->uri(), 'user/two-factor') || str_starts_with($route->uri(), 'user/recovery-codes')) {
                $this->assertNotContains('GET', $route->methods(), $route->uri().' can be read.');
            }
        }
    }

    public function test_enrolment_needs_a_recent_password_confirmation(): void
    {
        $this->actingAs($this->user());

        $this->postJson(route('two-factor.enable'))->assertStatus(423);
        $this->assertNull(User::query()->first()->two_factor_secret);
    }

    public function test_enrolment_returns_the_secret_once_and_stores_it_encrypted_and_unconfirmed(): void
    {
        $user = $this->user();

        $response = $this->signedIn($user)->postJson(route('two-factor.enable'))->assertOk()->assertHeader('Cache-Control', 'no-store, private');

        $secret = $response->json('secret');
        $this->assertMatchesRegularExpression('/^[A-Z2-7]{32}$/', $secret);
        $this->assertStringStartsWith('otpauth://totp/', $response->json('otpauthUrl'));
        $this->assertStringContainsString('issuer=Ziroemail', $response->json('otpauthUrl'));

        $row = DB::table('users')->where('id', $user->id)->first();
        $this->assertStringNotContainsString($secret, $row->two_factor_secret);
        $this->assertNull($row->two_factor_confirmed_at);
        $this->assertNotNull($row->two_factor_pending_until);
        $this->assertFalse($user->fresh()->hasConfirmedTwoFactor());
    }

    public function test_a_wrong_code_does_not_confirm_and_a_right_one_returns_ten_codes_once(): void
    {
        Notification::fake();
        $user = $this->user();
        $secret = $this->signedIn($user)->postJson(route('two-factor.enable'))->json('secret');

        $this->postJson(route('two-factor.confirm'), ['code' => '000000'])->assertStatus(422)->assertJsonValidationErrors('code');
        $this->assertFalse($user->fresh()->hasConfirmedTwoFactor());

        $before = session()->getId();
        $response = $this->postJson(route('two-factor.confirm'), ['code' => $this->otp($secret)])->assertOk();

        $codes = $response->json('recoveryCodes');
        $this->assertCount(10, $codes);
        foreach ($codes as $code) {
            $this->assertMatchesRegularExpression('/^[0-9a-hj-km-np-tv-z]{4}-[0-9a-hj-km-np-tv-z]{4}-[0-9a-hj-km-np-tv-z]{4}$/', $code);
        }
        $this->assertNotSame($before, session()->getId());
        $this->assertTrue($user->fresh()->hasConfirmedTwoFactor());
        $this->assertSame(10, $user->fresh()->unusedRecoveryCodeCount());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.two_factor_enabled']);
        Notification::assertSentTo($user, AccountSecurityNotification::class);

        // Stored only as keyed hashes.
        foreach ($codes as $code) {
            $this->assertSame(0, TwoFactorRecoveryCode::query()->where('code_hash', $code)->count());
            $this->assertSame(0, TwoFactorRecoveryCode::query()->where('code_hash', str_replace('-', '', $code))->count());
        }

        // Once confirmed, nothing returns the secret again.
        $this->postJson(route('two-factor.enable'))->assertStatus(409)->assertJsonMissing(['secret' => $secret]);
    }

    public function test_an_unconfirmed_secret_expires_after_ten_minutes(): void
    {
        $user = $this->user();
        $secret = $this->signedIn($user)->postJson(route('two-factor.enable'))->json('secret');

        $this->travel(11)->minutes();

        $this->postJson(route('two-factor.confirm'), ['code' => $this->otp($secret)])->assertStatus(422);
        $this->assertFalse($user->fresh()->hasConfirmedTwoFactor());
    }

    public function test_sign_in_with_two_factor_holds_at_the_challenge_and_regenerates_the_session(): void
    {
        $this->user(twoFactor: true);

        $this->get('/login');
        $before = session()->getId();
        $this->from('/login')->post(route('login.store'), ['email' => 'owner@adaobifoods.test', 'password' => 'correct horse battery'])
            ->assertRedirect(route('login.two-factor'));
        $this->assertGuest();
        $afterPassword = session()->getId();
        $this->assertNotSame($before, $afterPassword);

        $this->from('/login/two-factor')->post(route('login.two-factor.store'), ['code' => $this->otp()])->assertRedirect();

        $this->assertAuthenticated();
        $this->assertNotSame($afterPassword, session()->getId());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.two_factor_succeeded']);
    }

    public function test_the_challenge_page_needs_a_pending_sign_in(): void
    {
        $this->get('/login/two-factor')->assertRedirect(route('login'));
        $this->get('/login/recovery')->assertRedirect(route('login'));
        $this->post(route('login.two-factor.store'), ['code' => '123456'])->assertRedirect(route('login'));
    }

    private function challenge(): void
    {
        $this->post(route('login.store'), ['email' => 'owner@adaobifoods.test', 'password' => 'correct horse battery']);
    }

    public function test_a_wrong_or_replayed_code_is_refused(): void
    {
        $this->user(twoFactor: true);
        $this->challenge();

        $this->from('/login/two-factor')->post(route('login.two-factor.store'), ['code' => '000000'])->assertSessionHasErrors('code');
        $this->assertGuest();

        $code = $this->otp();
        $this->from('/login/two-factor')->post(route('login.two-factor.store'), ['code' => $code])->assertRedirect();
        $this->assertAuthenticated();

        // The same code cannot be used for a second sign in.
        $this->post('/logout');
        $this->challenge();
        $this->from('/login/two-factor')->post(route('login.two-factor.store'), ['code' => $code])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_the_challenge_is_limited_to_five_attempts_a_minute(): void
    {
        $this->user(twoFactor: true);
        $this->challenge();

        foreach (range(1, 5) as $i) {
            $this->postJson(route('login.two-factor.store'), ['code' => '000000'])->assertRedirect();
        }

        $this->postJson(route('login.two-factor.store'), ['code' => $this->otp()])->assertStatus(429)->assertHeader('Retry-After');
        $this->assertGuest();
    }

    public function test_ten_wrong_codes_destroy_the_pending_sign_in_and_tell_the_owner(): void
    {
        Notification::fake();
        $user = $this->user(twoFactor: true);
        $this->challenge();

        foreach (range(1, 10) as $i) {
            if ($i % 5 === 1 && $i > 1) {
                $this->travel(61)->seconds();
            }
            $last = $this->post(route('login.two-factor.store'), ['code' => '000000']);
        }

        $last->assertRedirect(route('login'));
        $this->get('/login/two-factor')->assertRedirect(route('login'));
        Notification::assertSentTo($user, AccountSecurityNotification::class);
    }

    public function test_a_pending_sign_in_expires_after_five_minutes(): void
    {
        $this->user(twoFactor: true);
        $this->challenge();

        $this->travel(6)->minutes();

        $this->get('/login/two-factor')->assertRedirect(route('login'));
        $this->post(route('login.two-factor.store'), ['code' => $this->otp()])->assertRedirect(route('login'));
        $this->assertGuest();
    }

    /**
     * @return list<string>
     */
    private function codesFor(User $user): array
    {
        return app(RecoveryCodeService::class)->generate($user);
    }

    public function test_a_recovery_code_signs_in_once_and_then_fails(): void
    {
        Notification::fake();
        $user = $this->user(twoFactor: true);
        $codes = $this->codesFor($user);

        $this->challenge();
        $rr = $this->from('/login/recovery')->post(route('login.recovery.store'), ['code' => strtoupper($codes[0])]);
        $rr->assertRedirect();

        $this->assertAuthenticated();
        $this->assertSame(9, $user->fresh()->unusedRecoveryCodeCount());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.recovery_code_used']);
        Notification::assertSentTo($user, AccountSecurityNotification::class, fn ($n) => str_contains($n->subject, 'recovery code'));

        $this->post('/logout');
        $this->challenge();
        $this->from('/login/recovery')->post(route('login.recovery.store'), ['code' => $codes[0]])->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->assertSame(9, $user->fresh()->unusedRecoveryCodeCount());
    }

    public function test_the_recovery_page_shows_only_the_remaining_count(): void
    {
        $user = $this->user(twoFactor: true);
        $this->codesFor($user);
        $this->challenge();

        $response = $this->get('/login/recovery')->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertSame(10, $props['unused']);
        $this->assertSame(10, $props['total']);
        $this->assertStringNotContainsString('code_hash', json_encode($props));
    }

    public function test_regenerating_replaces_every_old_code_and_needs_a_confirmation(): void
    {
        $user = $this->user(twoFactor: true);
        $this->actingAs($user);
        $this->postJson(route('recovery-codes.regenerate'))->assertStatus(423);

        $old = $this->codesFor($user);
        $this->withSession(['auth.password_confirmed_at' => time()]);
        $new = $this->postJson(route('recovery-codes.regenerate'))->assertOk()->json('recoveryCodes');

        $this->assertCount(10, $new);
        $this->assertEmpty(array_intersect($old, $new));
        $this->assertSame(10, $user->fresh()->unusedRecoveryCodeCount());
        $this->assertSame(0, TwoFactorRecoveryCode::query()->where('code_hash', 'like', '%'.substr($old[0], 0, 4).'%')->count());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.recovery_codes_regenerated']);
    }

    public function test_disabling_needs_a_confirmation_and_a_code_wipes_everything_and_ends_other_sessions(): void
    {
        Notification::fake();
        $user = $this->user(twoFactor: true);
        $this->codesFor($user);
        $this->signedIn($user);
        DB::table('sessions')->insert(['id' => 'elsewhere', 'user_id' => $user->id, 'ip_address' => '9.9.9.9', 'user_agent' => 'z', 'payload' => 'z', 'last_activity' => time()]);

        $this->deleteJson(route('two-factor.disable'), ['code' => '000000'])->assertStatus(422);
        $this->assertTrue($user->fresh()->hasConfirmedTwoFactor());

        $this->deleteJson(route('two-factor.disable'), ['code' => $this->otp()])->assertOk();

        $fresh = $user->fresh();
        $this->assertNull($fresh->two_factor_secret);
        $this->assertNull($fresh->two_factor_confirmed_at);
        $this->assertSame(0, $fresh->recoveryCodes()->count());
        $this->assertSame(0, DB::table('sessions')->where('id', 'elsewhere')->count());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.two_factor_disabled']);
        Notification::assertSentTo($user, AccountSecurityNotification::class, fn ($n) => str_contains($n->subject, 'turned off'));
    }

    public function test_disabling_without_a_recent_confirmation_is_refused(): void
    {
        $user = $this->user(twoFactor: true);
        $this->actingAs($user);

        $this->deleteJson(route('two-factor.disable'), ['code' => $this->otp()])->assertStatus(423);
        $this->assertTrue($user->fresh()->hasConfirmedTwoFactor());
    }

    public function test_the_prompt_can_be_snoozed_for_seven_days(): void
    {
        $user = $this->user();

        $this->actingAs($user)->postJson(route('two-factor.snooze'))->assertOk();

        $this->assertEqualsWithDelta(now()->addDays(7)->timestamp, $user->fresh()->two_factor_prompt_snoozed_until->timestamp, 5);
    }

    public function test_owners_are_prompted_not_forced_by_default(): void
    {
        $this->assertFalse(config('identity.two_factor.enforce_for_owners'));
        $this->actingAs($this->user());

        $this->get('/checkout')->assertOk();
    }

    public function test_one_config_flag_forces_owners_to_the_setup_page(): void
    {
        config(['identity.two_factor.enforce_for_owners' => true]);
        $this->actingAs($this->user());

        $this->get('/checkout')->assertRedirect(route('two-factor.setup'));
        $this->get('/two-factor/setup')->assertOk()->assertInertia(fn ($page) => $page->component('Auth/TwoFactorSetup')->where('forced', true));

    }
}
