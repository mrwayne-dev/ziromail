<?php

namespace App\Identity\Services;

use App\Identity\Enums\AuditAction;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Enrol, confirm, disable and regenerate. Shared by users and staff; the only
 * difference is policy (staff cannot disable), which the caller enforces.
 */
class TwoFactorManager
{
    public function __construct(
        private readonly TotpService $totp,
        private readonly RecoveryCodeService $recovery,
        private readonly AuditLogger $audit,
        private readonly SessionRevoker $sessions,
    ) {}

    /**
     * Starts enrolment: a new unconfirmed secret that expires in 10 minutes. The
     * secret is returned here and never again.
     *
     * @return array{secret: string, otpauthUrl: string, expiresAt: string}
     */
    public function start(Model $account): array
    {
        if ($account->hasConfirmedTwoFactor()) {
            throw new RuntimeException('Two-factor is already on.');
        }

        $secret = $this->totp->generateSecret();
        DB::transaction(function () use ($account, $secret) {
            $account->forceFill([
                'two_factor_secret' => $secret,
                'two_factor_confirmed_at' => null,
                'two_factor_last_used_step' => null,
                'two_factor_pending_until' => now()->addMinutes(config('identity.two_factor.setup_expires_minutes')),
            ])->save();

            $this->audit->record(AuditAction::TwoFactorEnrolmentStarted, $account);
        });

        return [
            'secret' => $secret,
            'otpauthUrl' => $this->totp->otpauthUrl($account->email, $secret),
            'expiresAt' => $account->two_factor_pending_until->toIso8601String(),
        ];
    }

    /**
     * Confirms enrolment with a code from the app. Returns the recovery codes in plain
     * text, once, or null when the code is wrong or the setup has expired.
     *
     * @return list<string>|null
     */
    public function confirm(Model $account, string $code): ?array
    {
        $pending = $account->two_factor_secret !== null
            && $account->two_factor_confirmed_at === null
            && $account->two_factor_pending_until?->isFuture();

        if (! $pending || ! $this->totp->verify($account, $code)) {
            return null;
        }

        return DB::transaction(function () use ($account) {
            $account->forceFill(['two_factor_confirmed_at' => now(), 'two_factor_pending_until' => null])->save();
            $codes = $this->recovery->generate($account);
            $this->audit->record(AuditAction::TwoFactorEnabled, $account);

            return $codes;
        });
    }

    /** Verifies a current TOTP code or a recovery code (which is spent). */
    public function verifyEither(Model $account, string $code): bool
    {
        return $this->totp->verify($account, $code) || $this->recovery->consume($account, $code);
    }

    public function disable(Model $account, ?string $exceptSessionId = null): void
    {
        DB::transaction(function () use ($account, $exceptSessionId) {
            $account->forceFill([
                'two_factor_secret' => null,
                'two_factor_confirmed_at' => null,
                'two_factor_pending_until' => null,
                'two_factor_last_used_step' => null,
            ])->save();
            $account->recoveryCodes()->delete();

            $ended = $this->sessions->endAll($account, $exceptSessionId);
            $this->audit->record(AuditAction::TwoFactorDisabled, $account, ['sessions_ended' => $ended]);
        });

        $account->notify(AccountSecurityNotification::twoFactorDisabled());
    }

    /**
     * @return list<string>
     */
    public function regenerate(Model $account): array
    {
        return DB::transaction(function () use ($account) {
            $codes = $this->recovery->generate($account);
            $this->audit->record(AuditAction::RecoveryCodesRegenerated, $account);

            return $codes;
        });
    }
}
