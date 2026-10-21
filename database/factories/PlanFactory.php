<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->slug(1),
            'name' => fake()->word(),
            'pool_gb' => 10,
            'ceiling_gb' => 25,
            'price_ngn_monthly' => 110000,
            'price_ngn_yearly' => 1200000,
            'price_usd_monthly' => 150,
            'price_usd_yearly' => 1200,
            'extra_block_gb' => 10,
            'extra_price_ngn_yearly' => 600000,
            'extra_price_usd_yearly' => 1200,
        ];
    }
}
