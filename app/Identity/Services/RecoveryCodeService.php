<?php

namespace App\Identity\Services;

use App\Identity\Support\Hmac;
use App\Models\TwoFactorRecoveryCode;
use Illuminate\Database\Eloquent\Model;

/**
 * Ten single-use codes, format xxxx-xxxx-xxxx (12 symbols of a 32-symbol alphabet,
 * 60 bits each). Stored only as a keyed hash: a fast keyed hash is right for
 * high-entropy random codes. Nothing can read an existing code back.
 */
class RecoveryCodeService
{
    private const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

    /**
     * Replaces every code for the account and returns the new set in plain text, once.
     *
     * @return list<string>
     */
    public function generate(Model $account): array
    {
        $account->recoveryCodes()->delete();

        $codes = [];
        for ($i = 0; $i < config('identity.two_factor.recovery_codes'); $i++) {
            $code = $this->randomCode();
            $codes[] = $code;
            $account->recoveryCodes()->create(['code_hash' => $this->hash($this->normalise($code))]);
        }

        return $codes;
    }

    /** Accepts a code once. The update is conditional, so two requests cannot both spend it. */
    public function consume(Model $account, string $input): bool
    {
        $normalised = $this->normalise($input);

        if (strlen($normalised) !== 12) {
            return false;
        }

        $hash = $this->hash($normalised);

        $row = $account->recoveryCodes()->whereNull('used_at')->get()
            ->first(fn (TwoFactorRecoveryCode $candidate) => hash_equals($candidate->code_hash, $hash));

        if ($row === null) {
            return false;
        }

        return TwoFactorRecoveryCode::query()->whereKey($row->getKey())->whereNull('used_at')->update(['used_at' => now()]) === 1;
    }

    public function remaining(Model $account): int
    {
        return $account->recoveryCodes()->whereNull('used_at')->count();
    }

    public function normalise(string $code): string
    {
        return preg_replace('/[^0-9a-z]/', '', strtolower($code)) ?? '';
    }

    private function hash(string $normalised): string
    {
        return Hmac::value('recovery', $normalised);
    }

    private function randomCode(): string
    {
        $symbols = '';
        for ($i = 0; $i < 12; $i++) {
            $symbols .= self::ALPHABET[random_int(0, 31)];
        }

        return implode('-', str_split($symbols, 4));
    }
}
