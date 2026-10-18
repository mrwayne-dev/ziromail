<?php

namespace App\Identity\Support;

use Illuminate\Support\Str;

/**
 * Keyed hashes for values that must never be stored raw in a cache key or an
 * audit row: an email typed into a form, a pending address, a session id.
 */
class Hmac
{
    public static function email(string $email): string
    {
        return self::make('email', Str::lower(trim($email)));
    }

    public static function value(string $namespace, string $value): string
    {
        return self::make($namespace, $value);
    }

    private static function make(string $namespace, string $value): string
    {
        $key = (string) config('app.key');
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7), true) ?: $key;
        }

        return hash_hmac('sha256', $namespace.':'.$value, hash_hmac('sha256', 'ziroemail.identity.v1', $key));
    }
}
