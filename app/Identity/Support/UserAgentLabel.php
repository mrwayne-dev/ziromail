<?php

namespace App\Identity\Support;

/**
 * A short "Browser on System" label from a user agent, without a dependency. It is
 * a label for a person to recognise a device, not a fingerprint.
 */
class UserAgentLabel
{
    public static function label(?string $userAgent): string
    {
        $ua = (string) $userAgent;

        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Chrome/') || str_contains($ua, 'CriOS/') => 'Chrome',
            str_contains($ua, 'Safari/') && str_contains($ua, 'Version/') => 'Safari',
            default => 'Browser',
        };

        $system = match (true) {
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'an unknown device',
        };

        return "{$browser} on {$system}";
    }

    /** The first three octets (or groups) only: enough to recognise a network, not to locate a person. */
    public static function maskIp(?string $ip): string
    {
        if ($ip === null || $ip === '') {
            return 'unknown';
        }

        if (str_contains($ip, ':')) {
            return implode(':', array_slice(explode(':', $ip), 0, 3)).':…';
        }

        $parts = explode('.', $ip);

        return count($parts) === 4 ? "{$parts[0]}.{$parts[1]}.{$parts[2]}.x" : $ip;
    }
}
