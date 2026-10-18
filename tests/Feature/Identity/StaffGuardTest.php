<?php

namespace Tests\Feature\Identity;

use App\Identity\Services\RecoveryCodeService;
use App\Models\Staff;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class StaffGuardTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

    private function staff(array $state = [], bool $twoFactor = true): Staff
    {
        $factory = Staff::factory();
        if ($twoFactor) {
            $factory = $factory->withTwoFactor();
        }

        return $factory->create(array_merge(['email' => 'ops@ziro.test', 'password' => 'a-very-long-staff-password'], $state));
    }

    private function loginAttempt(string $email, string $password, ?string $ip = null, bool $json = false)
    {
        $client = $ip ? $this->withServerVariables(['REMOTE_ADDR' => $ip]) : $this;

        return $json ? $client->postJson('/ops/login', ['email' => $email, 'password' => $password]) : $client->post('/ops/login', ['email' => $email, 'password' => $password]);
    }

    public function test_the_console_is_closed_to_guests_customers_and_unenrolled_staff(): void
    {
        $this->get('/ops')->assertRedirect('/ops/login');

        $this->actingAs(User::factory()->create(), 'web');
        $this->get('/ops')->assertRedirect('/ops/login');

        $this->actingAs($this->staff(twoFactor: false), 'staff');
        $this->get('/ops')->assertRedirect('/ops/security/enrol');
    }

    public function test_a_staff_session_cannot_open_customer_routes_and_a_customer_session_cannot_open_ops(): void
    {
        $this->actingAs($this->staff(), 'staff');
        $this->get('/ops')->assertOk();                     // signed in as staff: reaches the console
        $this->get('/dashboard')->assertRedirect(route('login'));
        $this->get('/checkout')->assertRedirect(route('login'));
        $this->getJson('/user/sessions')->assertUnauthorized();
    }

    public function test_the_staff_cookie_has_its_own_name_path_and_strict_samesite(): void
    {
        config(['session.secure' => true]);

        $ops = collect($this->get('https://ziroemail.test/ops/login')->headers->getCookies())->first(fn ($c) => $c->getName() === config('identity.staff_cookie'));
        $this->assertNotNull($ops);
        $this->assertSame('/ops', $ops->getPath());
        $this->assertSame('strict', $ops->getSameSite());
        $this->assertTrue($ops->isHttpOnly());
        $this->assertTrue($ops->isSecure());

        // The customer side is untouched by the staff settings (config restored per request).
        $web = collect($this->get('https://ziroemail.test/login')->headers->getCookies())->first(fn ($c) => $c->getName() === config('session.cookie'));
        $this->assertNotNull($web);
        $this->assertSame('/', $web->getPath());
        $this->assertSame('lax', $web->getSameSite());
    }

    public function test_staff_sessions_are_stored_in_their_own_table(): void
    {
        config(['session.driver' => 'database']);

        $this->get('/ops/login')->assertOk();

        $this->assertSame(1, DB::table('staff_sessions')->count());
        $this->assertSame(0, DB::table('sessions')->count());
    }

    public function test_wrong_password_and_unknown_staff_get_the_same_answer(): void
    {
        $this->staff();

        $wrong = $this->loginAttempt('ops@ziro.test', 'nope-nope-nope-nope');
        $unknown = $this->loginAttempt('nobody@ziro.test', 'nope-nope-nope-nope');

        $this->assertSame($wrong->getStatusCode(), $unknown->getStatusCode());
        $wrong->assertSessionHasErrors(['email' => 'That email and password do not match.']);
        $unknown->assertSessionHasErrors(['email' => 'That email and password do not match.']);
        $this->assertGuest('staff');
    }

    public function test_a_customer_cannot_sign_in_to_the_console_and_staff_cannot_sign_in_as_customers(): void
    {
        User::factory()->create(['email' => 'customer@x.test', 'password' => 'correct horse battery']);
        $this->staff();

        $this->loginAttempt('customer@x.test', 'correct horse battery')->assertSessionHasErrors('email');
        $this->post(route('login.store'), ['email' => 'ops@ziro.test', 'password' => 'a-very-long-staff-password'])->assertSessionHasErrors('email');
    }

    public function test_staff_sign_in_is_three_a_minute_and_ten_failures_lock_for_thirty_minutes(): void
    {
        Notification::fake();
        $owner = $this->staff(['email' => 'boss@ziro.test'])->forceFill(['role' => 'owner']);
        $owner->save();
        $this->staff(['email' => 'ops@ziro.test']);

        foreach (range(1, 3) as $i) {
            $this->loginAttempt('ops@ziro.test', 'bad-bad-bad-bad', json: true);
        }
        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password', json: true)->assertStatus(429);

        // Ten failures in an hour lock the account for thirty minutes and tell the owners.
        foreach (range(1, 7) as $i) {
            $this->travel(61)->seconds();
            foreach (range(1, 3) as $j) {
                $this->loginAttempt('ops@ziro.test', 'bad-bad-bad-bad', json: true);
                if ($i * 3 + $j >= 10) {
                    break 2;
                }
            }
        }

        $response = $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password', json: true)->assertStatus(429);
        $this->assertGreaterThan(20 * 60, (int) $response->headers->get('Retry-After'));
        Notification::assertSentTo($owner, AccountSecurityNotification::class);

        $this->travel(31)->minutes();
        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password', json: true)->assertRedirect();
    }

    public function test_first_sign_in_without_two_factor_reaches_only_the_enrolment_page(): void
    {
        $this->staff(twoFactor: false);

        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password')->assertRedirect('/ops/security/enrol');

        $this->assertAuthenticated('staff');
        $this->get('/ops')->assertRedirect('/ops/security/enrol');
        $this->get('/ops/security/sessions')->assertRedirect('/ops/security/enrol');
        $this->getJson('/ops/security/sessions')->assertStatus(403);
        $this->get('/ops/security/enrol')->assertOk()->assertInertia(fn ($page) => $page->component('Auth/TwoFactorSetup')->where('forced', true));
    }

    public function test_enrolling_unlocks_the_console(): void
    {
        $staff = $this->staff(twoFactor: false);
        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password');
        $this->withSession(['auth.password_confirmed_at' => time()]);

        $secret = $this->postJson('/ops/security/two-factor')->assertOk()->json('secret');
        $this->postJson('/ops/security/two-factor/confirm', ['code' => (new Google2FA)->getCurrentOtp($secret)])->assertOk()->assertJsonCount(10, 'recoveryCodes');

        $this->assertTrue($staff->fresh()->hasConfirmedTwoFactor());
        $this->get('/ops')->assertOk(); // through the guards to the console
    }

    public function test_staff_can_never_turn_two_factor_off(): void
    {
        $this->actingAs($this->staff(), 'staff');
        $this->withSession(['auth.password_confirmed_at' => time()]);

        $this->deleteJson('/ops/security/two-factor', ['code' => (new Google2FA)->getCurrentOtp(self::SECRET)])->assertStatus(405);
        $this->deleteJson('/user/two-factor', ['code' => '123456'])->assertUnauthorized();
        $this->assertTrue(Staff::query()->first()->hasConfirmedTwoFactor());
    }

    public function test_signing_in_with_two_factor_goes_through_the_challenge(): void
    {
        $this->staff();

        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password')->assertRedirect('/ops/login/two-factor');
        $this->assertGuest('staff');

        $this->post('/ops/login/two-factor', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->post('/ops/login/two-factor', ['code' => (new Google2FA)->getCurrentOtp(self::SECRET)])->assertRedirect();

        $this->assertAuthenticated('staff');
        $this->assertDatabaseHas('audit_log', ['actor_type' => 'staff', 'action' => 'auth.login_succeeded']);
    }

    public function test_a_staff_recovery_code_works_once(): void
    {
        $staff = $this->staff();
        $codes = app(RecoveryCodeService::class)->generate($staff);

        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password');
        $this->post('/ops/login/recovery', ['code' => $codes[0]])->assertRedirect();
        $this->assertAuthenticated('staff');

        $this->post('/ops/logout');
        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password');
        $this->post('/ops/login/recovery', ['code' => $codes[0]])->assertSessionHasErrors('code');
    }

    public function test_a_staff_session_ends_after_eight_hours_and_when_the_account_is_disabled(): void
    {
        $staff = $this->staff();
        $this->actingAs($staff, 'staff')->withSession(['staff.signed_in_at' => now()->subHours(9)->getTimestamp()]);
        $this->get('/ops')->assertRedirect('/ops/login');

        $this->actingAs($staff, 'staff')->withSession(['staff.signed_in_at' => now()->subHour()->getTimestamp()]);
        $this->get('/ops')->assertOk();

        $staff->forceFill(['disabled_at' => now()])->save();
        $this->actingAs($staff->fresh(), 'staff')->withSession(['staff.signed_in_at' => now()->getTimestamp()]);
        $this->get('/ops')->assertRedirect('/ops/login');
    }

    public function test_a_disabled_account_cannot_sign_in(): void
    {
        $this->staff(['disabled_at' => now()]);

        $this->loginAttempt('ops@ziro.test', 'a-very-long-staff-password')->assertSessionHasErrors('email');
        $this->assertGuest('staff');
    }

    public function test_staff_are_created_by_command_only_with_a_long_password(): void
    {
        $this->artisan('staff:create', ['name' => 'Chidi', 'email' => 'chidi@ziro.test', '--role' => 'owner'])
            ->expectsQuestion('Password (at least 14 characters)', 'a-very-long-staff-password')
            ->assertSuccessful();

        $staff = Staff::query()->where('email', 'chidi@ziro.test')->sole();
        $this->assertSame('owner', $staff->role);
        $this->assertTrue(\Hash::check('a-very-long-staff-password', $staff->password));
        $this->assertFalse($staff->hasConfirmedTwoFactor());

        $this->artisan('staff:create', ['name' => 'X', 'email' => 'x@ziro.test', '--role' => 'god'])->assertFailed();
        $this->assertDatabaseMissing('staff', ['email' => 'x@ziro.test']);
    }
}
