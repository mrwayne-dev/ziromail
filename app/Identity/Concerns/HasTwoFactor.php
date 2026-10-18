<?php

namespace App\Identity\Concerns;

use App\Models\TwoFactorRecoveryCode;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Two-factor state shared by users and staff. The secret itself is an encrypted
 * cast on each model and is hidden from serialisation.
 */
trait HasTwoFactor
{
    public function hasConfirmedTwoFactor(): bool
    {
        return $this->two_factor_secret !== null && $this->two_factor_confirmed_at !== null;
    }

    public function recoveryCodes(): MorphMany
    {
        return $this->morphMany(TwoFactorRecoveryCode::class, 'authenticatable');
    }

    public function unusedRecoveryCodeCount(): int
    {
        return $this->recoveryCodes()->whereNull('used_at')->count();
    }
}
