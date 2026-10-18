<?php

namespace App\Identity\Services;

use App\Identity\Support\Hmac;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Sign-in throttling (docs/DASHBOARD_BUILD.md 7.6). Every key is derived from the
 * submitted string through an HMAC, whether or not an account exists, so the
 * limiter itself never reveals which emails are registered.
 */
class LoginThrottle
{
    /** Seconds until another attempt is allowed, or null when it may proceed. */
    public function retryAfter(string $email, string $ip, ?User $user): ?int
    {
        $ei = $this->key($email, $ip);

        $blockedUntil = (int) Cache::get("login:until:{$ei}", 0);
        if ($blockedUntil > now()->getTimestamp()) {
            return $blockedUntil - now()->getTimestamp();
        }

        if (RateLimiter::tooManyAttempts("login:ei:{$ei}", config('identity.login.per_minute_email_ip'))) {
            return RateLimiter::availableIn("login:ei:{$ei}");
        }

        if (RateLimiter::tooManyAttempts("login:ip:{$ip}", config('identity.login.per_minute_ip'))) {
            return RateLimiter::availableIn("login:ip:{$ip}");
        }

        if ($this->distributedHoldActive($email) && ! $this->isFamiliarIp($user, $ip)) {
            return config('identity.login.hold_minutes') * 60;
        }

        return null;
    }

    /**
     * Count an attempt, and on failure advance the backoff. Returns the number of
     * consecutive failures for this email and IP.
     */
    public function hit(string $email, string $ip, bool $failed): int
    {
        $ei = $this->key($email, $ip);
        RateLimiter::hit("login:ei:{$ei}", 60);
        RateLimiter::hit("login:ip:{$ip}", 60);

        if (! $failed) {
            return 0;
        }

        $failures = (int) Cache::get("login:fails:{$ei}", 0) + 1;
        Cache::put("login:fails:{$ei}", $failures, now()->addDay());

        $hourly = RateLimiter::hit('login:hour:'.Hmac::email($email), 3600);
        unset($hourly);

        $steps = config('identity.login.backoff_minutes');
        $threshold = config('identity.login.per_minute_email_ip');
        if ($failures >= $threshold) {
            $minutes = $steps[min($failures - $threshold, count($steps) - 1)];
            Cache::put("login:until:{$ei}", now()->getTimestamp() + $minutes * 60, now()->addMinutes($minutes));
        }

        return $failures;
    }

    /** Failures that preceded this success (before they are cleared). */
    public function priorFailures(string $email, string $ip): int
    {
        return (int) Cache::get('login:fails:'.$this->key($email, $ip), 0);
    }

    public function clear(string $email, string $ip): void
    {
        $ei = $this->key($email, $ip);
        Cache::forget("login:fails:{$ei}");
        Cache::forget("login:until:{$ei}");
        RateLimiter::clear("login:ei:{$ei}");
    }

    public function distributedHoldActive(string $email): bool
    {
        return RateLimiter::attempts('login:hour:'.Hmac::email($email)) >= config('identity.login.distributed_failures_per_hour');
    }

    /** True the first time the distributed threshold is crossed in an hour (so the owner is emailed once). */
    public function shouldNotifyDistributed(string $email): bool
    {
        return $this->distributedHoldActive($email)
            && Cache::add('login:notified:'.Hmac::email($email), 1, now()->addHour());
    }

    /**
     * An IP is familiar when it has a live session or a successful sign in for
     * this account inside the familiarity window. A stranger's IP is not, so
     * the owner's own devices keep working during a distributed attack.
     */
    private function isFamiliarIp(?User $user, string $ip): bool
    {
        if ($user === null) {
            return false;
        }

        $since = now()->subDays(config('identity.login.familiar_days'));

        $session = DB::table('sessions')->where('user_id', $user->id)->where('ip_address', $ip)
            ->where('last_activity', '>=', $since->timestamp)->exists();

        return $session || AuditLog::query()->where('actor_type', 'user')->where('actor_id', $user->id)
            ->where('action', 'auth.login_succeeded')->where('ip_address', $ip)->where('created_at', '>=', $since)->exists();
    }

    private function key(string $email, string $ip): string
    {
        return Hmac::email($email).'|'.$ip;
    }
}
