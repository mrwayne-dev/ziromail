<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'site' => [
                'name' => 'Ziroemail',
                'url' => rtrim(config('app.url'), '/'),
                'prototype' => (bool) config('app.prototype'),
            ],
            // Exactly these keys and nothing else: a secret, token or recovery code never reaches a prop.
            'auth' => [
                'confirmedUntil' => fn () => ($at = $request->session()->get('auth.password_confirmed_at')) ? $at + config('auth.password_timeout') : null,
                'user' => fn () => ($user = $request->user('web')) ? [
                    'name' => $user->name,
                    'email' => $user->email,
                    'emailVerified' => $user->hasVerifiedEmail(),
                    'twoFactorEnabled' => $user->hasConfirmedTwoFactor(),
                    'recoveryCodesUnused' => $user->hasConfirmedTwoFactor() ? $user->unusedRecoveryCodeCount() : 0,
                    'snoozedUntil' => $user->two_factor_prompt_snoozed_until?->toIso8601String(),
                ] : null,
            ],
            // The signed-in staff member, only on the console. Same rule as `auth.user`: no secrets, no codes.
            'staff' => fn () => ($staff = $request->user('staff')) ? [
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staff->role,
                'twoFactorEnabled' => $staff->hasConfirmedTwoFactor(),
                'recoveryCodesUnused' => $staff->hasConfirmedTwoFactor() ? $staff->unusedRecoveryCodeCount() : 0,
            ] : null,
            'identity' => ['passwordMinLength' => config('identity.password.min')],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
