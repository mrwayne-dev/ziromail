<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\LoginRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\LoginThrottle;
use App\Identity\Services\PendingLogin;
use App\Identity\Services\SignIn;
use App\Identity\Support\Hmac;
use App\Identity\Support\Throttled;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    private const FAILURE = 'That email and password do not match.';

    private static ?string $dummyHash = null;

    public function store(LoginRequest $request, LoginThrottle $throttle, SignIn $signIn, AuditLogger $audit, PendingLogin $pending): RedirectResponse|Response
    {
        $email = $request->validated('email');
        $ip = (string) $request->ip();
        $user = User::query()->where('email', $email)->first();

        if (($wait = $throttle->retryAfter($email, $ip, $user)) !== null) {
            $audit->record(AuditAction::LoginThrottled, $user, ['email_hash' => Hmac::email($email), 'limiter' => 'login']);

            return Throttled::respond($request, $wait);
        }

        // A hash check runs even when no account exists, so response time does not reveal it.
        $valid = Hash::check($request->validated('password'), $user?->password ?? self::dummyHash()) && $user !== null;

        if (! $valid) {
            $failures = $throttle->hit($email, $ip, failed: true);
            $audit->record(AuditAction::LoginFailed, null, ['email_hash' => Hmac::email($email), 'attempts' => $failures]);

            if ($failures === config('identity.login.per_minute_email_ip') || $throttle->shouldNotifyDistributed($email)) {
                if ($user !== null && $throttle->distributedHoldActive($email)) {
                    $user->notify(AccountSecurityNotification::lockout());
                    $audit->record(AuditAction::Lockout, $user, ['limiter' => 'login']);
                }
            }

            return back()->withErrors(['email' => self::FAILURE])->onlyInput('email');
        }

        $throttle->hit($email, $ip, failed: false);

        if (Hash::needsRehash($user->password)) {
            $user->forceFill(['password' => $request->validated('password')])->saveQuietly();
        }

        if ($user->hasConfirmedTwoFactor()) {
            $request->session()->regenerate(true);
            $pending->start($request, 'web', $user->getKey(), $request->boolean('remember'));

            return redirect()->route('login.two-factor');
        }

        $signIn->complete($request, $user, $request->boolean('remember'));

        return redirect()->intended($this->home($request));
    }

    private function home(Request $request): string
    {
        if ($request->session()->pull('first_sign_in')) {
            $plan = $request->session()->pull('signup.plan');

            return route('onboarding.domain', array_filter(['plan' => $plan]));
        }

        return route('dashboard');
    }

    private static function dummyHash(): string
    {
        return self::$dummyHash ??= Hash::make(Str::random(40));
    }
}
