<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\RegisterRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Support\Hmac;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    public function store(RegisterRequest $request, AuditLogger $audit): RedirectResponse
    {
        $email = $request->validated('email');

        $this->guardRate($request->ip(), $email);
        $this->guardAllowed($email);

        // The same hashing work runs whether or not the address is already registered.
        $hash = Hash::make($request->validated('password'));
        $existing = User::query()->where('email', $email)->first();

        if ($existing === null) {
            $user = DB::transaction(function () use ($request, $email, $hash, $audit) {
                $user = new User([
                    'name' => $request->validated('business'),
                    'email' => $email,
                    'password' => 'placeholder',
                    'business_name' => $request->validated('business'),
                    'phone' => $request->validated('phone'),
                ]);
                $user->forceFill([
                    'password' => $hash,
                    'password_changed_at' => now(),
                    'terms_accepted_at' => now(),
                    'terms_version' => config('identity.terms_version', '2026-09'),
                ])->save();
                $audit->record(AuditAction::Registered, null, ['email_hash' => Hmac::email($email)], $user);

                return $user;
            });

            $user->sendEmailVerificationNotification();
        } else {
            $existing->notify(AccountSecurityNotification::registrationAttempt());
            $audit->record(AuditAction::RegistrationAttemptOnExisting, null, ['email_hash' => Hmac::email($email)], $existing);
        }

        $request->session()->regenerate(true);
        $request->session()->put('verification.pending_email', $email);
        if ($request->filled('plan')) {
            $request->session()->put('signup.plan', $request->string('plan')->toString());
        }

        return redirect()->route('verification.notice');
    }

    private function guardRate(?string $ip, string $email): void
    {
        $emailKey = 'register:email:'.Hmac::email($email);
        $ipKey = 'register:ip:'.$ip;

        if (RateLimiter::tooManyAttempts($emailKey, config('identity.register_limits.per_hour_email'))
            || RateLimiter::tooManyAttempts($ipKey, config('identity.register_limits.per_hour_ip'))) {
            throw ValidationException::withMessages(['email' => 'Too many attempts. Try again later.'])->status(429);
        }

        RateLimiter::hit($emailKey, 3600);
        RateLimiter::hit($ipKey, 3600);
    }

    private function guardAllowed(string $email): void
    {
        if (! config('identity.registration.enabled')) {
            throw ValidationException::withMessages(['email' => 'Registration is closed right now.']);
        }

        $allow = config('identity.registration.allowlist');
        if ($allow === []) {
            return;
        }

        $domain = '@'.substr(strrchr($email, '@') ?: '', 1);
        foreach ($allow as $entry) {
            if (strcasecmp($entry, $email) === 0 || (str_starts_with($entry, '@') && strcasecmp($entry, $domain) === 0)) {
                return;
            }
        }

        throw ValidationException::withMessages(['email' => 'Registration is limited to the team on this preview.']);
    }
}
