<?php

namespace App\Identity\Support;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The single "too many attempts" response. Inertia visits get a redirect back
 * carrying the message; every other client gets a plain 429 with Retry-After.
 */
class Throttled
{
    public static function respond(Request $request, int $seconds, string $field = 'email'): RedirectResponse|Response
    {
        $seconds = max(1, $seconds);
        $minutes = (int) ceil($seconds / 60);
        $message = 'Too many attempts. Try again in '.($minutes <= 1 ? 'a minute' : "{$minutes} minutes").'.';

        if ($request->header('X-Inertia')) {
            return back()->withErrors([$field => $message])->with('retry_after', $seconds);
        }

        return response($message, 429)->header('Retry-After', (string) $seconds);
    }
}
