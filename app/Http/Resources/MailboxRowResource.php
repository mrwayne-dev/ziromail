<?php

namespace App\Http\Resources;

use App\Models\Mailbox;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Mailbox
 */
class MailboxRowResource extends JsonResource
{
    /**
     * A row's size and state only. There is no field here, or in the table, for mail content.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nearFull = $this->state === 'active' && $this->quota_gb > 0 && ($this->used_gb / $this->quota_gb) >= 0.75;

        return [
            'id' => $this->id,
            'domainId' => $this->domain_id,
            'local' => $this->local_part,
            'roleLabel' => $this->role_label,
            'quotaGb' => $this->quota_gb,
            'usedGb' => $this->used_gb,
            'lastLoginAt' => $this->last_login_at?->toIso8601String(),
            'state' => $nearFull ? 'near_full' : $this->state,
            'setupCompletedAt' => $this->setup_completed_at?->toIso8601String(),
        ];
    }
}
