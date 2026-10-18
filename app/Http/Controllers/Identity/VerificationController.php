<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Identity\Services\EmailVerificationCode;
use App\Identity\Support\Hmac;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function notice(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user?->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $email = $user?->email ?? $request->session()->get('verification.pending_email');

        return Inertia::render('Auth/VerifyEmail', [
            'email' => $email,
            'digits' => (int) config('identity.verification.code_digits'),
            'expiresInMinutes' => (int) config('identity.verification.code_minutes'),
            'resendAvailableAt' => $email ? (int) Cache::get($this->cooldownKey($email), 0) : 0,
        ]);
    }

    /**
     * Check the 6-digit code. It needs no session beyond the address registration put there,
     * and every failure reads the same: a wrong code, an old one, a used one and an unknown
     * address cannot be told apart.
     */
    public function confirm(Request $request, EmailVerificationCode $codes): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:16']]);

        $email = $request->user()?->email ?? $request->session()->get('verification.pending_email');

        if ($email === null) {
            return redirect()->route('signup');
        }

        $key = 'verify-code:'.Hmac::email($email).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, (int) config('identity.verification.confirm_per_15_minutes'))) {
            throw ValidationException::withMessages(['code' => 'Too many attempts. Wait a few minutes, then try again.'])->status(429);
        }
        RateLimiter::hit($key, 900);

        $user = User::query()->where('email', $email)->first();
        $confirmed = $user !== null && ! $user->hasVerifiedEmail() && $codes->confirm($user, $request->string('code')->toString());

        if (! $confirmed) {
            if ($user?->hasVerifiedEmail()) {
                $request->session()->forget('verification.pending_email');

                return redirect()->route('login')->with('status', 'Your email is already confirmed. Sign in to continue.');
            }

            throw ValidationException::withMessages(['code' => 'That code is not right, or it has expired. Check the latest email or send a new one.']);
        }

        RateLimiter::clear($key);
        $request->session()->forget('verification.pending_email');

        return $request->user()
            ? redirect()->route('dashboard')
            : redirect()->route('login')->with('status', 'Your email is confirmed. Sign in to continue.');
    }

    public function resend(Request $request): RedirectResponse
    {
        $email = $request->user()?->email ?? $request->session()->get('verification.pending_email');

        if ($email === null) {
            return redirect()->route('signup');
        }

        $minute = 'verify:min:'.Hmac::email($email).'|'.$request->ip();
        $hour = 'verify:hour:'.Hmac::email($email).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($minute, config('identity.verification.resend_per_minute'))
            || RateLimiter::tooManyAttempts($hour, config('identity.verification.resend_per_hour'))) {
            return back()->with('status', 'Please wait a minute before asking for another code.');
        }

        RateLimiter::hit($minute, 60);
        RateLimiter::hit($hour, 3600);
        Cache::put($this->cooldownKey($email), now()->addMinute()->timestamp, now()->addMinutes(2));

        $user = User::query()->where('email', $email)->first();
        if ($user !== null && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return back()->with('status', 'sent');
    }

    private function cooldownKey(string $email): string
    {
        return 'verify:cooldown:'.Hmac::email($email);
    }
}
