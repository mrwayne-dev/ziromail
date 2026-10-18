<?php

namespace App\Identity\Services;

use Illuminate\Http\Request;

/**
 * A sign in that has passed the password but not the second factor. It lives in
 * the session for 5 minutes and is not an authenticated session.
 */
class PendingLogin
{
    private const KEY = 'login.pending';

    /**
     * @return array{guard: string, id: int|string, remember: bool, expires: int}|null
     */
    public function get(Request $request, string $guard): ?array
    {
        $pending = $request->session()->get(self::KEY);

        if (! is_array($pending) || ($pending['guard'] ?? null) !== $guard || ($pending['expires'] ?? 0) < now()->getTimestamp()) {
            return null;
        }

        return $pending;
    }

    public function start(Request $request, string $guard, int|string $id, bool $remember): void
    {
        $request->session()->put(self::KEY, [
            'guard' => $guard,
            'id' => $id,
            'remember' => $remember,
            'expires' => now()->addMinutes(config('identity.login.pending_minutes'))->getTimestamp(),
        ]);
    }

    public function forget(Request $request): void
    {
        $request->session()->forget(self::KEY);
    }
}
