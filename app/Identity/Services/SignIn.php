<?php

namespace App\Identity\Services;

use App\Identity\Enums\AuditAction;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Completes a web sign in: logs the user in, regenerates the session id (so a
 * pre-login id can never be carried over), records the event and, when the
 * success followed repeated failures, tells the owner.
 */
class SignIn
{
    public function __construct(private readonly AuditLogger $audit, private readonly LoginThrottle $throttle) {}

    public function complete(Request $request, User $user, bool $remember, bool $viaTwoFactor = false): void
    {
        $priorFailures = $this->throttle->priorFailures($user->email, (string) $request->ip());

        Auth::guard('web')->setRememberDuration(config('identity.sessions.web.remember_minutes'));
        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate(true);

        $firstEver = $user->last_login_at === null;
        $user->forceFill(['last_login_at' => now()])->saveQuietly();

        $this->audit->record(AuditAction::LoginSucceeded, $user, ['method' => $viaTwoFactor ? 'two_factor' : 'password']);
        $this->throttle->clear($user->email, (string) $request->ip());

        if ($priorFailures >= config('identity.login.notify_success_after_failures')) {
            $user->notify(AccountSecurityNotification::signInAfterFailures());
        }

        if ($firstEver) {
            $request->session()->put('first_sign_in', true);
        }
    }
}
