<?php

namespace App\Identity\Services;

use Illuminate\Database\Eloquent\Model;
use PragmaRX\Google2FA\Google2FA;

/**
 * TOTP per RFC 6238: SHA-1, 6 digits, 30 second step, a window of one step either
 * side. The secret is 32 base32 characters (160 bits). A code can be used only
 * once: the time step of the last accepted code is stored and must increase.
 */
class TotpService
{
    private Google2FA $engine;

    public function __construct()
    {
        $this->engine = new Google2FA;
        $this->engine->setWindow(config('identity.two_factor.window'));
    }

    public function generateSecret(): string
    {
        return $this->engine->generateSecretKey(config('identity.two_factor.secret_length'));
    }

    public function otpauthUrl(string $label, string $secret): string
    {
        return $this->engine->getQRCodeUrl(config('identity.two_factor.issuer'), $label, $secret);
    }

    /**
     * Checks a code against the account's secret (confirmed or pending). On success the
     * accepted time step is stored so the same code cannot be replayed.
     */
    public function verify(Model $account, string $code): bool
    {
        $secret = $account->two_factor_secret;
        $digits = preg_replace('/\s+/', '', $code);

        if ($secret === null || ! preg_match('/^\d{6}$/', (string) $digits)) {
            return false;
        }

        $now = $this->engine->getTimestamp();
        $window = config('identity.two_factor.window');
        $last = $account->two_factor_last_used_step;

        // Walk the allowed steps ourselves so the exact step that matched is the one stored.
        $accepted = null;
        for ($step = $now - $window; $step <= $now + $window; $step++) {
            if ($last !== null && $step <= $last) {
                continue;
            }
            if (hash_equals($this->engine->oathTotp($secret, $step), $digits)) {
                $accepted = $step;

                break;
            }
        }

        if ($accepted === null) {
            return false;
        }

        $account->forceFill(['two_factor_last_used_step' => $accepted])->saveQuietly();

        return true;
    }
}
