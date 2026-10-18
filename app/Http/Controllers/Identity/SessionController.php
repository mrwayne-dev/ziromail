<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Identity\Services\SessionRevoker;
use App\Identity\Support\Hmac;
use App\Identity\Support\UserAgentLabel;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * The signed-in account's own browser sessions, read from the database session
 * store. A session id never leaves the server: each row is identified by an
 * opaque keyed hash, so a script on the page cannot learn a usable cookie value.
 */
class SessionController extends Controller
{
    public function index(Request $request, SessionRevoker $sessions): JsonResponse
    {
        $current = $request->session()->getId();

        $rows = DB::table($sessions->tableFor($request->user()))->where('user_id', $request->user()->getKey())->orderByDesc('last_activity')->get();

        return response()->json([
            'sessions' => $rows->map(fn ($row) => [
                'handle' => Hmac::value('session', $row->id),
                'label' => UserAgentLabel::label($row->user_agent),
                'ip' => UserAgentLabel::maskIp($row->ip_address),
                'lastActiveAt' => Carbon::createFromTimestamp($row->last_activity)->toIso8601String(),
                'current' => hash_equals($row->id, $current),
            ])->values(),
        ])->header('Cache-Control', 'no-store, private');
    }

    public function destroy(Request $request, string $handle, AuditLogger $audit, SessionRevoker $sessions): JsonResponse
    {
        $user = $request->user();
        $this->limit($user->getKey());

        $row = DB::table($sessions->tableFor($user))->where('user_id', $user->getKey())->get()
            ->first(fn ($candidate) => hash_equals(Hmac::value('session', $candidate->id), $handle));

        if ($row === null) {
            return response()->json(['message' => 'That session has already ended.'], 404);
        }

        if (hash_equals($row->id, $request->session()->getId())) {
            return response()->json(['message' => 'This is the device you are using. Sign out instead.'], 422);
        }

        DB::transaction(function () use ($sessions, $user, $row, $audit, $handle) {
            // A remember-me cookie on that device would sign it straight back in, so the token is
            // rotated too. Other devices keep their live sessions and only lose the remember fallback.
            if ($user->getRememberTokenName()) {
                $user->forceFill([$user->getRememberTokenName() => Str::random(60)])->save();
            }

            $sessions->endOne($user, $row->id);
            $audit->record(AuditAction::SessionRevoked, $user, ['session_hash' => Str::substr($handle, 0, 16)]);
        });

        return response()->json(['ended' => 1]);
    }

    public function revokeOthers(Request $request, AuditLogger $audit, SessionRevoker $sessions): JsonResponse
    {
        $user = $request->user();
        $this->limit($user->getKey());

        $request->session()->regenerate(true);

        $ended = DB::transaction(function () use ($user, $sessions, $request, $audit) {
            if ($user->getRememberTokenName()) {
                $user->forceFill([$user->getRememberTokenName() => Str::random(60)])->save();
            }
            $ended = $sessions->endAll($user, $request->session()->getId());
            $audit->record(AuditAction::SessionsRevokedAll, $user, ['sessions_ended' => $ended]);

            return $ended;
        });

        $user->notify(AccountSecurityNotification::sessionsRevoked());

        return response()->json(['ended' => $ended]);
    }

    private function limit(int|string $userId): void
    {
        $key = 'session-revoke:'.$userId;

        abort_if(RateLimiter::tooManyAttempts($key, config('identity.session_revoke.per_hour_user')), 429, 'Too many attempts. Try again later.');
        RateLimiter::hit($key, 3600);
    }
}
