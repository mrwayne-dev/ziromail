<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\ConfirmPasswordRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmPasswordController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/ConfirmPassword');
    }

    public function store(ConfirmPasswordRequest $request, AuditLogger $audit): RedirectResponse|\Illuminate\Http\Response
    {
        $user = $request->user();
        $perMinute = 'confirm:min:'.$user->getKey();
        $perHour = 'confirm:hour:'.$user->getKey();

        if (RateLimiter::tooManyAttempts($perMinute, config('identity.confirm_password.per_minute_user'))) {
            return back()->withErrors(['password' => 'Too many attempts. Wait a minute and try again.']);
        }

        if (! Hash::check($request->validated('password'), $user->password)) {
            RateLimiter::hit($perMinute, 60);
            $failures = RateLimiter::hit($perHour, 3600);
            $audit->record(AuditAction::PasswordConfirmFailed, $user, ['attempts' => $failures]);

            if ($failures >= config('identity.confirm_password.failures_before_sign_out')) {
                Auth::guard()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect($request->is('ops/*') ? '/ops/login' : route('login'))->with('status', 'You were signed out after too many wrong passwords.');
            }

            return back()->withErrors(['password' => 'That password is not right.']);
        }

        RateLimiter::clear($perMinute);
        $request->session()->put('auth.password_confirmed_at', time());

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return $request->header('X-Inertia') ? back() : redirect()->intended($request->is('ops/*') ? '/ops' : route('dashboard'));
    }
}
