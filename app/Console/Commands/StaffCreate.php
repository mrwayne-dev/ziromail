<?php

namespace App\Console\Commands;

use App\Models\Staff;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\password;

class StaffCreate extends Command
{
    protected $signature = 'staff:create {name} {email} {--role=support : support, engineer or owner}';

    protected $description = 'Create an operations console account. Staff exist only through this command.';

    public function handle(): int
    {
        $role = (string) $this->option('role');
        $validator = Validator::make(
            ['name' => $this->argument('name'), 'email' => mb_strtolower((string) $this->argument('email')), 'role' => $role],
            ['name' => 'required|string|max:120', 'email' => 'required|email|unique:staff,email', 'role' => 'in:support,engineer,owner'],
        );

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $plain = password('Password (at least 14 characters)', required: true, validate: fn (string $value) => strlen($value) < 14 ? 'Use at least 14 characters.' : null);

        $staff = new Staff($validator->validated());
        $staff->forceFill(['password' => $plain, 'password_changed_at' => now()])->save();

        $this->info("Created {$staff->role} account for {$staff->email}. They must turn on two-factor at first sign in.");

        return self::SUCCESS;
    }
}
