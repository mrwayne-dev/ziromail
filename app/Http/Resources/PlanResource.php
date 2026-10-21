<?php

namespace App\Http\Resources;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Plans in the shape the pricing components already read, so one source (the plans table) feeds them.
 *
 * @mixin Plan
 */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'poolGb' => $this->pool_gb,
            'ceilingGb' => $this->ceiling_gb,
            'featured' => $this->featured,
            'price' => [
                'NGN' => ['monthly' => $this->price_ngn_monthly, 'yearly' => $this->price_ngn_yearly],
                'USD' => ['monthly' => $this->price_usd_monthly, 'yearly' => $this->price_usd_yearly],
            ],
            'extraStorage' => [
                'blockGb' => $this->extra_block_gb,
                'price' => ['NGN' => ['yearly' => $this->extra_price_ngn_yearly], 'USD' => ['yearly' => $this->extra_price_usd_yearly]],
            ],
        ];
    }
}
