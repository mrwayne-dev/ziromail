<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Support\Hmac;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
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
        $state = $request->session()->get('verification_state', 'waiting');

        return Inertia::render('Auth/VerifyEmail', [
            'email' => $email,
            'state' => $state,
            'expiresInHours' => (int) (config('auth.verification.expire') / 60),
            'resendAvailableAt' => $email ? (int) Cache::get($this->cooldownKey($email), 0) : 0,
        ]);
    }

    /**
     * The link in the email. It needs no session, so it works when opened on a phone.
     * A bad signature, an expired link, an unknown user and a wrong hash all end in the same place.
     */
    public function verify(Request $request, AuditLogger $audit, string $id, string $hash): RedirectResponse
    {
        $user = URL::hasValidSignature($request) ? User::query()->find($id) : null;

        if ($user === null || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return redirect()->route('verification.notice')->with('verification_state', 'expired');
        }

        if (! $user->hasVerifiedEmail()) {
            DB::transaction(function () use ($user, $audit) {
                $user->markEmailAsVerified();
                $audit->record(AuditAction::EmailVerified, $user);
            });
            event(new Verified($user));
        }

        $request->session()->forget('verification.pending_email');

        return redirect()->route('login')->with('status', 'Your email is confirmed. Sign in to continue.');
    }

    public function resend(Request $request, AuditLogger $audit): RedirectResponse
    {
        $email = $request->user()?->email ?? $request->session()->get('verification.pending_email');

        if ($email === null) {
            return redirect()->route('signup');
        }

        $minute = 'verify:min:'.Hmac::email($email).'|'.$request->ip();
        $hour = 'verify:hour:'.Hmac::email($email).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($minute, config('identity.verification.resend_per_minute'))
            || RateLimiter::tooManyAttempts($hour, config('identity.verification.resend_per_hour'))) {
            return back()->with('status', 'Please wait a minute before asking for another link.');
        }

        RateLimiter::hit($minute, 60);
        RateLimiter::hit($hour, 3600);
        Cache::put($this->cooldownKey($email), now()->addMinute()->timestamp, now()->addMinutes(2));

        $user = User::query()->where('email', $email)->first();
        if ($user !== null && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
            $audit->record(AuditAction::EmailVerificationSent, $user);
        }

        return back()->with('status', 'sent');
    }

    private function cooldownKey(string $email): string
    {
        return 'verify:cooldown:'.Hmac::email($email);
    }
}
