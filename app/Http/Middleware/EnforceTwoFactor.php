<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * When `identity.two_factor.enforce_for_owners` is on, a signed-in user without
 * confirmed two-factor is sent to the setup page. Off by default: owners are
 * prompted, not forced (docs/DASHBOARD_BUILD.md 7.9).
 */
class EnforceTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        if (config('identity.two_factor.enforce_for_owners')
            && $user !== null
            && ! $user->hasConfirmedTwoFactor()
            && ! $request->is('two-factor/setup', 'user/*', 'logout', 'confirm-password')) {
            return redirect()->route('two-factor.setup');
        }

        return $next($request);
    }
}
