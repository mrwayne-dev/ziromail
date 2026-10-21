<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AuditLog
 */
class ActivityItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // `*bold*` in the stored summary becomes the emphasised part; the rest stays plain text.
        $emphasis = preg_match('/\*([^*]+)\*/', (string) $this->summary, $match) ? $match[1] : null;

        return [
            'id' => (string) $this->id,
            'at' => $this->created_at->toIso8601String(),
            'actor' => ['type' => $this->actor_type, 'name' => $this->actor_type === 'user' ? 'You' : 'Ziroemail'],
            'text' => str_replace('*', '', (string) $this->summary),
            'emphasis' => $emphasis,
            'category' => $this->category,
            'detail' => $this->detail,
        ];
    }
}
