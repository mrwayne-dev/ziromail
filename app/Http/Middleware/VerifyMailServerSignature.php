<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only our mail server may report sending counts. The body is signed with a shared secret
 * (HMAC-SHA256 over "timestamp.body"), and the timestamp must be recent so a captured request
 * cannot be replayed later. With no secret configured the endpoint is closed, not open.
 */
class VerifyMailServerSignature
{
    public const WINDOW_SECONDS = 300;

    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('ziroemail.mail_events_secret');
        $timestamp = (string) $request->header('X-Ziro-Timestamp');
        $signature = (string) $request->header('X-Ziro-Signature');

        if ($secret === '') {
            abort(503);
        }

        $fresh = ctype_digit($timestamp) && abs(time() - (int) $timestamp) <= self::WINDOW_SECONDS;
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);

        // One answer for every failure, so nothing says which part was wrong.
        abort_unless($fresh && hash_equals($expected, $signature), 401);

        return $next($request);
    }
}
