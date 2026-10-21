<?php

namespace App\Http\Resources;

use App\Models\DomainRecord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DomainRecord
 */
class DomainRecordResource extends JsonResource
{
    private const TITLE = [
        'MX' => 'where your mail is delivered',
        'SPF' => 'who may send as you',
        'DKIM' => 'the signature on every message',
        'DMARC' => 'what to do with failures',
    ];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $expected = $this->expected;
        $fields = [['key' => 'host', 'label' => 'Host', 'value' => $expected['host']]];
        if (isset($expected['priority'])) {
            $fields[] = ['key' => 'target', 'label' => 'Points to', 'value' => $expected['value']];
            $fields[] = ['key' => 'priority', 'label' => 'Priority', 'value' => (string) $expected['priority']];
        } else {
            $fields[] = ['key' => 'value', 'label' => 'Value', 'value' => $expected['value']];
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => self::TITLE[$this->type] ?? '',
            'status' => $this->status,
            'fields' => $fields,
            'observed' => $this->observed === null ? null : [['key' => 'value', 'label' => 'Value', 'value' => (string) ($this->observed['value'] ?? '')]],
            'lastCheckedAt' => $this->last_checked_at?->toIso8601String(),
            'brokenSince' => $this->broken_since?->toDateString(),
        ];
    }
}
