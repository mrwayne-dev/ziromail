<?php

namespace App\Http\Controllers\Identity\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\CodeRequest;
use App\Http\Requests\Identity\LoginRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\PendingLogin;
use App\Identity\Services\RecoveryCodeService;
use App\Identity\Services\TotpService;
use App\Identity\Support\Hmac;
use App\Identity\Support\Throttled;
use App\Models\Staff;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Sign in for the operations console, on the separate `staff` guard. No
 * registration and no self-service reset: staff are created by command. Two-factor
 * is mandatory; a staff member who has not enrolled signs in only as far as the
 * enrolment page.
 */
class StaffAuthController extends Controller
{
    private const FAILURE = 'That email and password do not match.';

    private static ?string $dummyHash = null;

    public function create(): InertiaResponse
    {
        return Inertia::render('Auth/Login', [
            'guard' => 'staff',
            'action' => '/ops/login',
            'title' => 'Staff sign in',
            'lead' => 'The operations console. Two-factor is required.',
        ]);
    }

    public function store(LoginRequest $request, AuditLogger $audit, PendingLogin $pending): RedirectResponse|Response
    {
        $email = $request->validated('email');
        $ip = (string) $request->ip();
        $eiKey = 'staff-login:ei:'.Hmac::email($email).'|'.$ip;
        $hourKey = 'staff-login:hour:'.Hmac::email($email);
        $lockKey = 'staff-login:lock:'.Hmac::email($email);

        if (($until = (int) Cache::get($lockKey, 0)) > now()->getTimestamp()) {
            return Throttled::respond($request, $until - now()->getTimestamp());
        }
        if (RateLimiter::tooManyAttempts($eiKey, config('identity.staff_login.per_minute_email_ip'))) {
            return Throttled::respond($request, RateLimiter::availableIn($eiKey));
        }
        RateLimiter::hit($eiKey, 60);

        $staff = Staff::query()->where('email', $email)->whereNull('disabled_at')->first();
        $valid = Hash::check($request->validated('password'), $staff?->password ?? self::dummyHash()) && $staff !== null;

        if (! $valid) {
            $audit->record(AuditAction::LoginFailed, null, ['email_hash' => Hmac::email($email), 'guard' => 'staff']);

            if (RateLimiter::hit($hourKey, 3600) >= config('identity.staff_login.failures_per_hour')) {
                $minutes = config('identity.staff_login.lock_minutes');
                Cache::put($lockKey, now()->addMinutes($minutes)->getTimestamp(), now()->addMinutes($minutes));
                RateLimiter::clear($hourKey);
                $audit->record(AuditAction::Lockout, $staff, ['guard' => 'staff', 'locked_until' => (string) now()->addMinutes($minutes)->toIso8601String()]);
                Staff::query()->where('role', 'owner')->get()->each->notify(AccountSecurityNotification::lockout());
            }

            return back()->withErrors(['email' => self::FAILURE])->onlyInput('email');
        }

        RateLimiter::clear($eiKey);
        RateLimiter::clear($hourKey);

        if (Hash::needsRehash($staff->password)) {
            $staff->forceFill(['password' => $request->validated('password')])->saveQuietly();
        }

        $request->session()->regenerate(true);

        if ($staff->hasConfirmedTwoFactor()) {
            $pending->start($request, 'staff', $staff->getKey(), false);

            return redirect('/ops/login/two-factor');
        }

        $this->completeSignIn($request, $staff, $audit, 'password');

        return redirect('/ops/security/enrol');
    }

    public function challengeShow(Request $request, PendingLogin $pending): InertiaResponse|RedirectResponse
    {
        $staff = $this->pendingStaff($request, $pending);

        return $staff === null ? redirect('/ops/login') : Inertia::render('Auth/TwoFactor', [
            'email' => $staff->email,
            'guard' => 'staff',
            'action' => '/ops/login/two-factor',
            'recoveryUrl' => '/ops/login/recovery',
            'backUrl' => '/ops/login',
        ]);
    }

    public function recoveryShow(Request $request, PendingLogin $pending, RecoveryCodeService $recovery): InertiaResponse|RedirectResponse
    {
        $staff = $this->pendingStaff($request, $pending);

        return $staff === null ? redirect('/ops/login') : Inertia::render('Auth/Recovery', [
            'email' => $staff->email,
            'total' => config('identity.two_factor.recovery_codes'),
            'unused' => $recovery->remaining($staff),
            'guard' => 'staff',
            'action' => '/ops/login/recovery',
            'backUrl' => '/ops/login/two-factor',
        ]);
    }

    public function challenge(CodeRequest $request, PendingLogin $pending, TotpService $totp, AuditLogger $audit): RedirectResponse|Response
    {
        return $this->attempt($request, $pending, $audit, fn (Staff $staff, string $code) => $totp->verify($staff, $code), false);
    }

    public function recovery(CodeRequest $request, PendingLogin $pending, RecoveryCodeService $recovery, AuditLogger $audit): RedirectResponse|Response
    {
        return $this->attempt($request, $pending, $audit, fn (Staff $staff, string $code) => $recovery->consume($staff, $code), true);
    }

    public function destroy(Request $request, AuditLogger $audit): RedirectResponse
    {
        $audit->record(AuditAction::Logout, $request->user('staff'), ['guard' => 'staff']);

        Auth::guard('staff')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/ops/login');
    }

    private function attempt(CodeRequest $request, PendingLogin $pending, AuditLogger $audit, callable $check, bool $recoveryCode): RedirectResponse|Response
    {
        $staff = $this->pendingStaff($request, $pending);

        if ($staff === null) {
            return redirect('/ops/login')->with('status', 'Your sign in timed out. Enter your password again.');
        }

        $key = 'staff-two-factor:'.$staff->getKey();
        if (RateLimiter::tooManyAttempts($key, config('identity.two_factor.attempts_per_minute_pending'))) {
            return Throttled::respond($request, RateLimiter::availableIn($key), 'code');
        }
        RateLimiter::hit($key, 60);

        if (! $check($staff, $request->validated('code'))) {
            $audit->record(AuditAction::TwoFactorFailed, $staff, ['guard' => 'staff']);
            $failKey = 'staff-two-factor:fails:'.$staff->getKey();
            $fails = (int) Cache::get($failKey, 0) + 1;
            Cache::put($failKey, $fails, now()->addMinutes(config('identity.two_factor.failure_window_minutes')));

            if ($fails >= config('identity.two_factor.failures_before_reset')) {
                Cache::forget($failKey);
                $pending->forget($request);

                return redirect('/ops/login')->with('status', 'Too many wrong codes. Enter your password again.');
            }

            return back()->withErrors(['code' => $recoveryCode ? 'That recovery code did not work.' : 'That code did not work. Try the one showing now.']);
        }

        Cache::forget('staff-two-factor:fails:'.$staff->getKey());
        $pending->forget($request);
        $this->completeSignIn($request, $staff, $audit, $recoveryCode ? 'recovery' : 'two_factor');
        $audit->record(AuditAction::TwoFactorSucceeded, $staff, ['guard' => 'staff']);

        if ($recoveryCode) {
            $remaining = $staff->unusedRecoveryCodeCount();
            $audit->record(AuditAction::RecoveryCodeUsed, $staff, ['remaining' => $remaining, 'guard' => 'staff']);
            $staff->notify(AccountSecurityNotification::recoveryCodeUsed($remaining));
        }

        return redirect()->intended('/ops');
    }

    private function completeSignIn(Request $request, Staff $staff, AuditLogger $audit, string $method): void
    {
        Auth::guard('staff')->login($staff);
        $request->session()->regenerate(true);
        $request->session()->put('staff.signed_in_at', now()->getTimestamp());
        $staff->forceFill(['last_login_at' => now()])->saveQuietly();
        $audit->record(AuditAction::LoginSucceeded, $staff, ['method' => $method, 'guard' => 'staff']);
    }

    private function pendingStaff(Request $request, PendingLogin $pending): ?Staff
    {
        $state = $pending->get($request, 'staff');

        return $state ? Staff::query()->find($state['id']) : null;
    }

    private static function dummyHash(): string
    {
        return self::$dummyHash ??= Hash::make(Str::random(40));
    }
}
