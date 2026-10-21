<?php

namespace App\Identity\Services;

use App\Identity\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * The only writer of audit_log. Metadata is an allow-list: a key that is not
 * named here is dropped, so a secret can never be written by accident.
 */
class AuditLogger
{
    /** @var list<string> */
    public const METADATA_KEYS = [
        'email_hash', 'reason', 'remaining', 'session_hash', 'guard', 'limiter', 'method', 'count',
        'familiar_ip', 'locked_until', 'attempts', 'route', 'sessions_ended', 'quota_from', 'quota_to', 'plan',
    ];

    public function __construct(private readonly Request $request) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(AuditAction $action, ?Model $actor = null, array $metadata = [], ?Model $subject = null): AuditLog
    {
        [$type, $id] = match (true) {
            $actor instanceof Staff => ['staff', $actor->getKey()],
            $actor instanceof User => ['user', $actor->getKey()],
            default => ['guest', null],
        };

        return $this->write($type, $id, $action, $metadata, $subject);
    }

    /**
     * An entry for a customer's own activity log. `$summary` is one sentence the server builds from
     * non-secret facts; wrap the part to show in bold in asterisks (`You created *sales@acme.com*`).
     * `$owner` scopes it to that account, so it appears in their log and nobody else's.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function account(AuditAction $action, User $owner, string $category, string $summary, ?Model $actor = null, ?string $detail = null, ?Model $subject = null, array $metadata = []): AuditLog
    {
        [$type, $id] = match (true) {
            $actor instanceof Staff => ['staff', $actor->getKey()],
            $actor instanceof User => ['user', $actor->getKey()],
            default => ['system', null],
        };

        return $this->write($type, $id, $action, $metadata, $subject, [
            'account_id' => $owner->getKey(),
            'category' => $category,
            'summary' => mb_substr(strip_tags($summary), 0, 255),
            'detail' => $detail === null ? null : mb_substr(strip_tags($detail), 0, 255),
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function system(AuditAction $action, array $metadata = []): AuditLog
    {
        return $this->write('system', null, $action, $metadata, null);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function write(string $type, int|string|null $id, AuditAction $action, array $metadata, ?Model $subject, array $extra = []): AuditLog
    {
        return AuditLog::query()->forceCreate([
            'actor_type' => $type,
            'actor_id' => $id,
            'action' => $action->value,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'ip_address' => $this->request->ip(),
            'user_agent' => $this->request->userAgent() ? mb_substr($this->request->userAgent(), 0, 500) : null,
            'metadata' => array_intersect_key($metadata, array_flip(self::METADATA_KEYS)) ?: null,
        ] + $extra);
    }
}
