<?php

namespace App\Identity\Services;

use App\Identity\Enums\AuditAction;
use App\Identity\Support\Hmac;
use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The 6-digit code that confirms an email address. It is random, stored only as a
 * keyed hash, valid for a few minutes, single use, and dies after a handful of
 * wrong guesses. Sending is immediate (not queued) so the code arrives while the
 * person is still looking at the screen; a send failure is logged, never shown.
 */
class EmailVerificationCode
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function issue(User $user): void
    {
        $digits = (int) config('identity.verification.code_digits');
        $code = str_pad((string) random_int(0, (10 ** $digits) - 1), $digits, '0', STR_PAD_LEFT);

        $user->forceFill([
            'verification_code_hash' => $this->hash($user, $code),
            'verification_code_expires_at' => now()->addMinutes((int) config('identity.verification.code_minutes')),
            'verification_code_attempts' => 0,
        ])->save();

        try {
            $user->notifyNow(new VerificationCodeNotification($code, (int) config('identity.verification.code_minutes')));
            $this->audit->record(AuditAction::EmailVerificationSent, $user);
        } catch (Throwable $e) {
            Log::error('Verification code email could not be sent.', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * True when the code was right (the address is then confirmed). A wrong or stale
     * code counts against the user and returns false, with no hint which it was.
     */
    public function confirm(User $user, string $code): bool
    {
        $stored = $user->verification_code_hash;
        $live = $stored !== null
            && $user->verification_code_expires_at?->isFuture()
            && $user->verification_code_attempts < (int) config('identity.verification.code_max_attempts');

        $normalised = preg_replace('/\D/', '', $code) ?? '';
        $right = $live && hash_equals($stored, $this->hash($user, $normalised));

        if (! $right) {
            if ($stored !== null) {
                $user->forceFill(['verification_code_attempts' => $user->verification_code_attempts + 1])->save();
            }

            return false;
        }

        DB::transaction(function () use ($user) {
            $user->forceFill([
                'verification_code_hash' => null,
                'verification_code_expires_at' => null,
                'verification_code_attempts' => 0,
            ])->save();
            $user->markEmailAsVerified();
            $this->audit->record(AuditAction::EmailVerified, $user);
        });
        event(new Verified($user));

        return true;
    }

    private function hash(User $user, string $code): string
    {
        return Hmac::value('verification-code:'.$user->id, $code);
    }
}
