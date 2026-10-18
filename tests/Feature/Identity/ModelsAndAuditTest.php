<?php

namespace Tests\Feature\Identity;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Support\Hmac;
use App\Identity\Support\RedactLogContext;
use App\Models\AuditLog;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class ModelsAndAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_model_leaves_mass_assignment_open(): void
    {
        $models = collect(glob(app_path('Models/*.php')))
            ->map(fn (string $file) => 'App\\Models\\'.basename($file, '.php'));

        $this->assertNotEmpty($models);

        foreach ($models as $class) {
            /** @var Model $model */
            $model = new $class;
            $this->assertNotSame([], $model->getGuarded(), "{$class} has an empty \$guarded.");
            $this->assertNotContains('two_factor_secret', $model->getFillable(), "{$class} lets the secret be mass assigned.");
            $this->assertNotContains('password_changed_at', $model->getFillable());
            $this->assertNotContains('email_verified_at', $model->getFillable());
        }
    }

    public function test_the_two_factor_secret_is_encrypted_at_rest_and_hidden(): void
    {
        $user = User::factory()->withTwoFactor('ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOP')->create();

        $raw = \DB::table('users')->where('id', $user->id)->value('two_factor_secret');
        $this->assertStringNotContainsString('ABCDEFGHIJKLMNOP', $raw);
        $this->assertSame('ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOP', $user->fresh()->two_factor_secret);
        $this->assertArrayNotHasKey('two_factor_secret', $user->fresh()->toArray());
        $this->assertArrayNotHasKey('password', $user->fresh()->toArray());
    }

    public function test_staff_are_a_separate_table_from_customers(): void
    {
        $staff = Staff::factory()->create(['email' => 'ops@example.test']);

        $this->assertDatabaseHas('staff', ['email' => 'ops@example.test']);
        $this->assertDatabaseMissing('users', ['email' => 'ops@example.test']);
        $this->assertSame('staff', $staff->getTable());
    }

    public function test_audit_log_is_append_only(): void
    {
        $row = AuditLog::factory()->create();

        try {
            $row->action = 'x';
            $row->save();
            $this->fail('update should throw');
        } catch (LogicException) {
            $this->assertTrue(true);
        }

        $this->expectException(LogicException::class);
        $row->delete();
    }

    public function test_the_audit_logger_writes_one_row_and_drops_unlisted_metadata(): void
    {
        $user = User::factory()->create();

        app(AuditLogger::class)->record(AuditAction::PasswordChanged, $user, [
            'sessions_ended' => 2,
            'password' => 'hunter2',
            'two_factor_secret' => 'ABC',
            'email' => 'someone@example.test',
        ]);

        $row = AuditLog::query()->sole();
        $this->assertSame('user', $row->actor_type);
        $this->assertSame($user->id, $row->actor_id);
        $this->assertSame('auth.password_changed', $row->action);
        $this->assertSame(['sessions_ended' => 2], $row->metadata);
    }

    public function test_unknown_emails_are_stored_only_as_a_keyed_hash(): void
    {
        $hash = Hmac::email(' Someone@Example.test ');

        $this->assertSame($hash, Hmac::email('someone@example.test'));
        $this->assertSame(64, strlen($hash));
        $this->assertStringNotContainsString('someone', $hash);
    }

    public function test_the_log_redactor_replaces_secret_context(): void
    {
        $out = RedactLogContext::redact(['user' => 5, 'password' => 'x', 'nested' => ['Token' => 'y', 'ok' => 1]]);

        $this->assertSame(['user' => 5, 'password' => '[redacted]', 'nested' => ['Token' => '[redacted]', 'ok' => 1]], $out);
    }
}
