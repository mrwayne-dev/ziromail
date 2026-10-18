<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Staff two-factor is mandatory. A staff member without confirmed two-factor can
 * reach only the enrolment page (and what enrolling needs); everything else
 * redirects there.
 */
class RequireStaffTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $staff = $request->user('staff');

        if ($staff !== null && ! $staff->hasConfirmedTwoFactor()) {
            if ($request->expectsJson()) {
                abort(403, 'Two-factor must be turned on first.');
            }

            return redirect('/ops/security/enrol');
        }

        return $next($request);
    }
}
