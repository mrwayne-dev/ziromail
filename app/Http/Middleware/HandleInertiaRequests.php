<?php

namespace App\Http\Middleware;

use App\Http\Resources\DomainSummaryResource;
use App\Http\Resources\PlanResource;
use App\Models\AbuseFlag;
use App\Models\Plan;
use App\Services\AccountContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
                    'id' => $user->id,
                    'ownerId' => $user->id,
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
            // The nav badge on the console: how many flags wait for a person.
            'opsCounts' => fn () => $request->user('staff') ? ['abuse' => Cache::remember('ops.abuse.open', 15, fn () => AbuseFlag::query()->where('status', 'open')->count())] : null,
            // The signed-in customer's account and domains, only on dashboard screens (one scoped query set per request).
            'account' => fn () => $request->routeIs('dashboard*') && $request->user('web')
                ? [
                    'domains' => DomainSummaryResource::collection(app(AccountContext::class)->domains())->resolve(),
                    'isOwner' => app(AccountContext::class)->isOwner(),
                ]
                : null,
            // Prices and pool sizes, from the plans table, so the website and the dashboard can never disagree.
            'catalog' => fn () => Cache::remember('plans.catalog', 60, fn () => PlanResource::collection(Plan::query()->where('active', true)->orderBy('sort')->get())->resolve()),
            'identity' => ['passwordMinLength' => config('identity.password.min')],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
