<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\CodeRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\PendingLogin;
use App\Identity\Services\RecoveryCodeService;
use App\Identity\Services\SignIn;
use App\Identity\Services\TotpService;
use App\Identity\Support\Throttled;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * The second step of web sign in: an authenticator code, or a recovery code.
 * Reachable only with a pending sign in that has already passed the password.
 */
class TwoFactorChallengeController extends Controller
{
    public function show(Request $request, PendingLogin $pending, RecoveryCodeService $recovery): InertiaResponse|RedirectResponse
    {
        $user = $this->pendingUser($request, $pending);

        if ($user === null) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactor', ['email' => $user->email]);
    }

    public function recoveryShow(Request $request, PendingLogin $pending, RecoveryCodeService $recovery): InertiaResponse|RedirectResponse
    {
        $user = $this->pendingUser($request, $pending);

        if ($user === null) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/Recovery', [
            'email' => $user->email,
            'total' => config('identity.two_factor.recovery_codes'),
            'unused' => $recovery->remaining($user),
        ]);
    }

    public function store(CodeRequest $request, PendingLogin $pending, TotpService $totp, SignIn $signIn, AuditLogger $audit): RedirectResponse|Response
    {
        return $this->attempt($request, $pending, $audit, $signIn, fn (User $user, string $code) => $totp->verify($user, $code), false);
    }

    public function recoveryStore(CodeRequest $request, PendingLogin $pending, RecoveryCodeService $recovery, SignIn $signIn, AuditLogger $audit): RedirectResponse|Response
    {
        return $this->attempt($request, $pending, $audit, $signIn, fn (User $user, string $code) => $recovery->consume($user, $code), true);
    }

    private function attempt(CodeRequest $request, PendingLogin $pending, AuditLogger $audit, SignIn $signIn, callable $check, bool $recoveryCode): RedirectResponse|Response
    {
        $state = $pending->get($request, 'web');
        $user = $state ? User::query()->find($state['id']) : null;

        if ($user === null) {
            return redirect()->route('login')->with('status', 'Your sign in timed out. Enter your password again.');
        }

        // Keyed on the account being challenged, so dropping the session cookie does not reset the count.
        $session = 'two-factor:user:'.$user->getKey();
        $ip = 'two-factor:ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($session, config('identity.two_factor.attempts_per_minute_pending'))
            || RateLimiter::tooManyAttempts($ip, config('identity.two_factor.attempts_per_minute_ip'))) {
            return Throttled::respond($request, max(RateLimiter::availableIn($session), 1), 'code');
        }
        RateLimiter::hit($session, 60);
        RateLimiter::hit($ip, 60);

        if (! $check($user, $request->validated('code'))) {
            $audit->record(AuditAction::TwoFactorFailed, $user, ['method' => $recoveryCode ? 'recovery' : 'totp']);

            $failKey = 'two-factor:fails:'.$user->getKey();
            $fails = (int) Cache::get($failKey, 0) + 1;
            Cache::put($failKey, $fails, now()->addMinutes(config('identity.two_factor.failure_window_minutes')));

            if ($fails >= config('identity.two_factor.failures_before_reset')) {
                Cache::forget($failKey);
                $pending->forget($request);
                $user->notify(AccountSecurityNotification::lockout());

                return redirect()->route('login')->with('status', 'Too many wrong codes. Enter your password again.');
            }

            return back()->withErrors(['code' => $recoveryCode
                ? 'That recovery code did not work. Check for typos, or try another one. Each code works only once.'
                : 'That code did not work. Codes change every 30 seconds, so try the one showing now.']);
        }

        Cache::forget('two-factor:fails:'.$user->getKey());
        $pending->forget($request);
        $signIn->complete($request, $user, $state['remember'], viaTwoFactor: true);
        $audit->record(AuditAction::TwoFactorSucceeded, $user, ['method' => $recoveryCode ? 'recovery' : 'totp']);

        if ($recoveryCode) {
            $remaining = $user->unusedRecoveryCodeCount();
            $audit->record(AuditAction::RecoveryCodeUsed, $user, ['remaining' => $remaining]);
            $user->notify(AccountSecurityNotification::recoveryCodeUsed($remaining));
            $request->session()->flash('status', "Signed in with a recovery code. {$remaining} unused codes remain.");
        }

        return redirect()->intended($this->home($request));
    }

    private function pendingUser(Request $request, PendingLogin $pending): ?User
    {
        $state = $pending->get($request, 'web');

        return $state ? User::query()->find($state['id']) : null;
    }

    private function home(Request $request): string
    {
        if ($request->session()->pull('first_sign_in')) {
            return route('onboarding.domain', array_filter(['plan' => $request->session()->pull('signup.plan')]));
        }

        return route('dashboard');
    }
}
