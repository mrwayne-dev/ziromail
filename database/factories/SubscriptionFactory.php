<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'domain_id' => Domain::factory(),
            'plan_id' => Plan::factory(),
            'term' => 'annual',
            'status' => 'active',
            'renews_at' => now()->addYear()->toDateString(),
            'paid_by' => 'transfer',
            'currency' => 'NGN',
            'price_net' => 1200000,
            'vat' => 90000,
        ];
    }
}
