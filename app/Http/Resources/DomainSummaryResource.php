<?php

namespace App\Http\Resources;

use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Domain
 */
class DomainSummaryResource extends JsonResource
{
    /**
     * Requires the subscription.plan, mailboxes and records relations to be loaded.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $subscription = $this->subscription;
        $passing = $this->records->where('status', 'passing')->count();
        $failing = $this->records->firstWhere('status', '!=', 'passing');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'planCode' => $subscription?->plan->code,
            'state' => $this->state,
            'mailboxCount' => $this->mailboxes->count(),
            'assignedGb' => $this->assignedGb(),
            'usedGb' => $this->usedGb(),
            'poolGb' => $subscription ? $this->poolGb() : 0,
            'planGb' => $subscription?->plan->pool_gb ?? 0,
            'boughtGb' => $subscription?->extra_storage_gb ?? 0,
            'ceilingGb' => $subscription?->plan->ceiling_gb,
            'renewsAt' => $subscription?->renews_at?->toDateString(),
            'recordsPassing' => $passing,
            'recordsTotal' => $this->records->count(),
            'healthNote' => $failing === null
                ? ($this->records->isEmpty() ? 'Waiting for records' : 'All records passing')
                : match ($failing->status) {
                    'missing' => $failing->type.' missing',
                    'needs_fix' => $failing->type.' needs fixing',
                    default => 'Waiting for '.$failing->type,
                },
        ];
    }
}
