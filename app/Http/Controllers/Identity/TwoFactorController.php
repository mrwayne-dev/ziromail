<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\CodeRequest;
use App\Identity\Services\TwoFactorManager;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Two-factor management for the signed-in account. JSON endpoints: the secret and
 * the recovery codes are returned in the response that creates them and are never
 * readable again, and none of these responses may be cached.
 */
class TwoFactorController extends Controller
{
    public function store(Request $request, TwoFactorManager $twoFactor): JsonResponse
    {
        $user = $request->user();
        $this->limit($user->getKey());

        if ($user->hasConfirmedTwoFactor()) {
            return $this->json(['message' => 'Two-factor is already on.'], 409);
        }

        return $this->json($twoFactor->start($user));
    }

    public function confirm(CodeRequest $request, TwoFactorManager $twoFactor): JsonResponse
    {
        $user = $request->user();
        $this->limit($user->getKey());

        $codes = $twoFactor->confirm($user, $request->validated('code'));

        if ($codes === null) {
            throw ValidationException::withMessages(['code' => 'That code did not match. Use the one showing in your app now, or start again.']);
        }

        $request->session()->regenerate(true);
        $user->notify(AccountSecurityNotification::twoFactorEnabled());

        return $this->json(['recoveryCodes' => $codes, 'unused' => count($codes), 'total' => count($codes)]);
    }

    public function destroy(CodeRequest $request, TwoFactorManager $twoFactor): JsonResponse
    {
        $user = $request->user();
        $this->limit($user->getKey());

        if (! $user->hasConfirmedTwoFactor()) {
            return $this->json(['message' => 'Two-factor is not on.'], 409);
        }

        if (! $twoFactor->verifyEither($user, $request->validated('code'))) {
            throw ValidationException::withMessages(['code' => 'That code did not work. Use a code from your app or a recovery code.']);
        }

        $request->session()->regenerate(true);
        $twoFactor->disable($user, $request->session()->getId());

        return $this->json(['twoFactorEnabled' => false]);
    }

    public function snooze(Request $request): JsonResponse
    {
        $request->user()->forceFill([
            'two_factor_prompt_snoozed_until' => now()->addDays(config('identity.two_factor.prompt_snooze_days')),
        ])->save();

        return $this->json(['snoozedUntil' => $request->user()->two_factor_prompt_snoozed_until->toIso8601String()]);
    }

    /** @param  array<string, mixed>  $data */
    private function json(array $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status)->header('Cache-Control', 'no-store, private');
    }

    private function limit(int|string $userId): void
    {
        $key = 'two-factor-setup:'.$userId;

        if (RateLimiter::tooManyAttempts($key, config('identity.two_factor.setup_per_hour'))) {
            throw ValidationException::withMessages(['code' => 'Too many attempts. Try again later.'])->status(429);
        }

        RateLimiter::hit($key, 3600);
    }
}
