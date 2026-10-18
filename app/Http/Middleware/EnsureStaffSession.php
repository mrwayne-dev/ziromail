<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * For an authenticated staff session: end it after 8 hours whatever the activity,
 * and when the account has been disabled.
 */
class EnsureStaffSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $staff = Auth::guard('staff')->user();

        if ($staff !== null) {
            $signedInAt = (int) $request->session()->get('staff.signed_in_at', 0);
            $expired = $signedInAt > 0 && now()->getTimestamp() - $signedInAt > config('identity.sessions.staff.absolute_hours') * 3600;

            if ($staff->disabled_at !== null || $expired) {
                Auth::guard('staff')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect('/ops/login')->with('status', $expired ? 'Your session ended after 8 hours. Sign in again.' : 'This account is disabled.');
            }
        }

        return $next($request);
    }
}
