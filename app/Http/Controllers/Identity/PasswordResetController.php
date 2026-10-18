<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\ForgotPasswordRequest;
use App\Http\Requests\Identity\ResetPasswordRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\SessionRevoker;
use App\Identity\Support\Hmac;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    private const INVALID = 'This link is invalid or has expired. Ask for a new one.';

    /**
     * Always the same answer: the address exists, does not exist, is unverified,
     * or the request was throttled. The email goes out only if the account exists.
     */
    public function request(ForgotPasswordRequest $request, AuditLogger $audit): RedirectResponse
    {
        $email = $request->validated('email');
        $emailKey = 'reset:email:'.Hmac::email($email);
        $ipKey = 'reset:ip:'.$request->ip();

        $limited = RateLimiter::tooManyAttempts($emailKey, config('identity.reset.request_per_hour_email'))
            || RateLimiter::tooManyAttempts($ipKey, config('identity.reset.request_per_hour_ip'));

        RateLimiter::hit($emailKey, 3600);
        RateLimiter::hit($ipKey, 3600);

        $user = User::query()->where('email', $email)->first();

        if (! $limited && $user !== null) {
            Password::sendResetLink(['email' => $email]);
        }

        $audit->record(AuditAction::PasswordResetRequested, $user, ['email_hash' => Hmac::email($email), 'limiter' => $limited ? 'reset-request' : null]);

        return back()->with('status', 'reset-link-sent');
    }

    public function create(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    public function store(ResetPasswordRequest $request, AuditLogger $audit, SessionRevoker $sessions): RedirectResponse
    {
        $email = $request->validated('email');
        $ipKey = 'reset-submit:ip:'.$request->ip();
        $emailKey = 'reset-submit:email:'.Hmac::email($email);

        if (RateLimiter::tooManyAttempts($ipKey, config('identity.reset.submit_per_minute_ip'))
            || RateLimiter::tooManyAttempts($emailKey, config('identity.reset.submit_per_hour_email'))) {
            return back()->withErrors(['email' => 'Too many attempts. Try again in a few minutes.']);
        }
        RateLimiter::hit($ipKey, 60);
        RateLimiter::hit($emailKey, 3600);

        $revoked = 0;
        $status = Password::reset(
            ['email' => $email, 'token' => $request->validated('token'), 'password' => $request->validated('password'), 'password_confirmation' => $request->input('password_confirmation')],
            function (User $user, string $password) use (&$revoked, $audit, $sessions) {
                DB::transaction(function () use ($user, $password, &$revoked, $audit, $sessions) {
                    $user->forceFill([
                        'password' => $password,
                        'password_changed_at' => now(),
                        'remember_token' => Str::random(60),
                    ])->save();

                    $revoked = $sessions->endAll($user);
                    $audit->record(AuditAction::PasswordResetCompleted, $user, ['sessions_ended' => $revoked]);
                });

                $user->notify(AccountSecurityNotification::passwordResetCompleted());
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            // A wrong token, an expired one, an unknown address and a throttle all read the same.
            return back()->withErrors(['email' => self::INVALID]);
        }

        $request->session()->regenerate(true);

        return redirect()->route('login')->with('status', 'Your password has been reset. Sign in with the new one.');
    }
}
