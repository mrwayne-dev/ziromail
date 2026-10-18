<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs before StartSession on every request. For /ops it gives the console its own
 * cookie (name, path /ops, SameSite Strict), its own session table and idle limit,
 * and makes `staff` the default guard, so the session handler records staff ids in
 * staff_sessions and a customer session can never be read here (and vice versa).
 * Every other request gets the original customer settings back, so nothing carries
 * over between requests in a long-lived worker.
 */
class ConfigureStaffSession
{
    private const KEYS = ['session.cookie', 'session.path', 'session.table', 'session.same_site', 'session.lifetime', 'session.expire_on_close'];

    /** @var array<string, mixed>|null */
    private static ?array $customer = null;

    private static ?bool $lastWasOps = null;

    public function handle(Request $request, Closure $next): Response
    {
        self::$customer ??= collect(self::KEYS)->mapWithKeys(fn (string $key) => [$key => config($key)])->all();
        $ops = $request->is('ops', 'ops/*');

        if ($ops) {
            config([
                'session.cookie' => config('identity.staff_cookie'),
                'session.path' => '/ops',
                'session.table' => 'staff_sessions',
                'session.same_site' => 'strict',
                'session.lifetime' => config('identity.sessions.staff.idle_minutes'),
                'session.expire_on_close' => true,
            ]);

            Auth::shouldUse('staff');
        } else {
            config(self::$customer);
            Auth::shouldUse('web');
        }

        // The session manager caches its driver (and the cookie name inside it). When a worker
        // moves between the console and the customer site, drop it so the settings above apply.
        if (self::$lastWasOps !== null && self::$lastWasOps !== $ops) {
            app('session')->forgetDrivers();
        }
        self::$lastWasOps = $ops;

        return $next($request);
    }
}
