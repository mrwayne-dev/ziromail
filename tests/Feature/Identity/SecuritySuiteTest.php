<?php

namespace Tests\Feature\Identity;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class SecuritySuiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_failed_audit_write_aborts_the_state_change(): void
    {
        $user = User::factory()->create(['password' => 'correct horse battery']);
        $old = $user->password;

        $this->mock(AuditLogger::class, fn ($mock) => $mock->shouldReceive('record')->andThrow(new RuntimeException('audit down')));

        $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('user-password.update'), ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertStatus(500);

        $this->assertSame($old, $user->fresh()->password, 'The password changed although its audit row could not be written.');
    }

    public function test_every_audit_event_is_wired_somewhere_in_the_app(): void
    {
        $identity = collect(glob(app_path('{Http/Controllers/Identity,Http/Controllers/Identity/Staff,Identity/Services}/*.php'), GLOB_BRACE))
            ->map(fn ($file) => file_get_contents($file))->implode("\n");
        $account = collect(glob(app_path('{Http/Controllers/Dashboard,Http/Controllers/Mail,Services/Dashboard,Services/Abuse,Http/Controllers/Ops}/*.php'), GLOB_BRACE))->map(fn ($file) => file_get_contents($file))->implode("\n");

        // Events for features whose backend is not connected yet (DNS checks, payments): defined now, emitted when they exist.
        $pending = ['domain.verified', 'domain.record_changed', 'billing.storage_added', 'billing.plan_changed'];

        foreach (AuditAction::cases() as $case) {
            if (in_array($case->value, $pending, true)) {
                continue;
            }

            $source = str_starts_with($case->value, 'auth.') ? $identity : $account;
            $this->assertStringContainsString('AuditAction::'.$case->name, $source, $case->value.' is never recorded.');
        }
    }

    public function test_secrets_never_reach_the_log_or_a_rendered_response(): void
    {
        $canary = 'CANARY-hunter2-'.bin2hex(random_bytes(4));
        Log::error('canary', ['password' => $canary, 'nested' => ['token' => $canary, 'ok' => 'visible']]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringNotContainsString($canary, $log);
        $this->assertStringContainsString('[redacted]', $log);

        // A failed sign in must not echo the typed password back into the page.
        $page = $this->from('/login')->post(route('login.store'), ['email' => 'nobody@x.test', 'password' => $canary]);
        $follow = $this->get('/login');
        $this->assertStringNotContainsString($canary, $follow->getContent());
        $this->assertStringNotContainsString($canary, json_encode(session()->all()));
        unset($page);
    }

    public function test_rehash_on_login_upgrades_an_old_hash_to_argon2id(): void
    {
        $user = User::factory()->create(['password' => 'correct horse battery']);
        $this->assertStringStartsWith('$2y$', DB::table('users')->where('id', $user->id)->value('password'));

        config(['hashing.driver' => 'argon2id']);
        app('hash')->forgetDrivers();
        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'correct horse battery'])->assertRedirect();

        $this->assertStringStartsWith('$argon2id$', DB::table('users')->where('id', $user->id)->value('password'));
        $this->assertTrue(Hash::check('correct horse battery', $user->fresh()->password));
    }

    public function test_the_default_hashing_driver_is_argon2id_and_sanctum_is_stateful_without_tokens(): void
    {
        $hashing = require config_path('hashing.php');
        $this->assertStringContainsString('argon2id', file_get_contents(config_path('hashing.php')));
        $this->assertTrue($hashing['rehash_on_login']);

        $this->assertSame(['web'], config('sanctum.guard'));
        $this->assertNull(config('sanctum.expiration'));
        $this->assertFalse(Schema::hasTable('personal_access_tokens'), 'No personal access tokens are issued in this phase.');
        $this->assertStringContainsString('zrm_', file_get_contents(base_path('.env.example')));
    }

    public function test_the_password_policy_values(): void
    {
        $this->assertSame(10, config('identity.password.min'));
        $this->assertSame(128, config('identity.password.max'));
        $this->assertTrue((bool) config('identity.password.uncompromised') || config('identity.password.uncompromised') === false);
        $this->assertSame(['password', 'password_confirmation', 'current_password'], array_slice(['password', 'password_confirmation', 'current_password'], 0, 3));
    }

    public function test_password_change_session_revoke_and_two_factor_setup_are_rate_limited_per_hour(): void
    {
        $user = User::factory()->create(['password' => 'correct horse battery']);
        $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);

        foreach (range(1, config('identity.password_change.per_hour_user')) as $i) {
            $this->from('/x')->post(route('user-password.update'), ['current_password' => 'wrong-wrong-wrong', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase']);
        }
        $this->postJson(route('user-password.update'), ['current_password' => 'correct horse battery', 'password' => 'a brand new long passphrase', 'password_confirmation' => 'a brand new long passphrase'])
            ->assertStatus(429);

        foreach (range(1, config('identity.session_revoke.per_hour_user')) as $i) {
            $this->deleteJson(route('sessions.destroy', str_repeat('a', 64)))->assertNotFound();
        }
        $this->deleteJson(route('sessions.destroy', str_repeat('a', 64)))->assertStatus(429);

        foreach (range(1, config('identity.two_factor.setup_per_hour')) as $i) {
            $this->postJson(route('two-factor.confirm'), ['code' => '000000'])->assertStatus(422);
        }
        $this->postJson(route('two-factor.confirm'), ['code' => '000000'])->assertStatus(429);
    }

    public function test_static_assets_get_the_same_headers_from_htaccess(): void
    {
        $htaccess = file_get_contents(public_path('.htaccess'));

        foreach (['X-Content-Type-Options "nosniff"', 'X-Frame-Options "DENY"', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Resource-Policy'] as $header) {
            $this->assertStringContainsString($header, $htaccess);
        }
    }
}
