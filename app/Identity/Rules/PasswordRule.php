<?php

namespace App\Identity\Rules;

use Illuminate\Validation\Rules\Password;

/**
 * The one password policy (docs/DASHBOARD_BUILD.md 7.4): at least 10 characters,
 * at most 128, no composition rules, and not seen 3 or more times in known breaches
 * (k-anonymity range lookup, failing open if the service is unreachable).
 */
class PasswordRule
{
    /**
     * @return list<mixed>
     */
    public static function rules(): array
    {
        $password = Password::min(config('identity.password.min'));

        if (config('identity.password.uncompromised')) {
            $password = $password->uncompromised(config('identity.password.uncompromised_threshold'));
        }

        return ['required', 'string', 'max:'.config('identity.password.max'), $password];
    }
}
