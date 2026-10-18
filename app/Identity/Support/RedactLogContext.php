<?php

namespace App\Identity\Support;

use Illuminate\Log\Logger;
use Monolog\LogRecord;

/**
 * A Monolog processor that replaces the value of any secret-looking key in a
 * log record's context with a fixed marker. Applied to every channel through
 * the `tap` option in config/logging.php.
 */
class RedactLogContext
{
    public const KEYS = [
        'password', 'password_confirmation', 'current_password', 'code', 'recovery_code', 'token',
        'two_factor_secret', 'secret', 'remember_token', 'authorization', 'cookie',
    ];

    public function __invoke(Logger|\Monolog\Logger $logger): void
    {
        $monolog = $logger instanceof Logger ? $logger->getLogger() : $logger;

        $monolog->pushProcessor(fn (LogRecord $record) => $record->with(context: self::redact($record->context)));
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<array-key, mixed>
     */
    public static function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && in_array(strtolower($key), self::KEYS, true)) {
                $data[$key] = '[redacted]';
            } elseif (is_array($value)) {
                $data[$key] = self::redact($value);
            }
        }

        return $data;
    }
}
