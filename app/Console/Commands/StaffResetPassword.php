<?php

namespace App\Console\Commands;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\SessionRevoker;
use App\Models\Staff;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;

class StaffResetPassword extends Command
{
    protected $signature = 'staff:reset-password {email}';

    protected $description = 'Set a new password for a staff account and end all of its sessions. Staff have no self-service reset.';

    public function handle(AuditLogger $audit, SessionRevoker $sessions): int
    {
        $staff = Staff::query()->where('email', mb_strtolower((string) $this->argument('email')))->first();

        if ($staff === null) {
            $this->error('No staff account has that email.');

            return self::FAILURE;
        }

        $plain = password('New password (at least 14 characters)', required: true, validate: fn (string $value) => strlen($value) < 14 ? 'Use at least 14 characters.' : null);

        $staff->forceFill(['password' => $plain, 'password_changed_at' => now()])->save();
        $ended = $sessions->endAll($staff);
        $audit->system(AuditAction::PasswordResetCompleted, ['guard' => 'staff', 'sessions_ended' => $ended]);

        $this->info("Password reset for {$staff->email}. {$ended} sessions ended.");

        return self::SUCCESS;
    }
}
