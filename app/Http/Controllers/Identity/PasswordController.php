<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\ChangePasswordRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\SessionRevoker;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    public function update(ChangePasswordRequest $request, AuditLogger $audit, SessionRevoker $sessions): RedirectResponse
    {
        $user = $request->user();
        $request->session()->regenerate(true);

        // The change, the ended sessions and the audit row commit together or not at all.
        DB::transaction(function () use ($request, $user, $audit, $sessions) {
            $user->forceFill([
                'password' => $request->validated('password'),
                'password_changed_at' => now(),
                ...($user->getRememberTokenName() ? [$user->getRememberTokenName() => Str::random(60)] : []),
            ])->save();

            $ended = $sessions->endAll($user, $request->session()->getId());
            $audit->record(AuditAction::PasswordChanged, $user, ['sessions_ended' => $ended]);
        });

        // AuthenticateSession compares this hash on every request; keep it current for this session.
        $request->session()->put('password_hash_'.Auth::getDefaultDriver(), $user->getAuthPassword());
        $user->notify(AccountSecurityNotification::passwordChanged());

        return back()->with('status', 'Your password was changed and your other devices were signed out.');
    }
}
