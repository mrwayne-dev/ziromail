<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * The three plans, per business with a shared storage pool. Prices are minor units
     * (kobo, cents) and are only a starting point: ops edits them once Q1 to Q3 are decided.
     */
    public function run(): void
    {
        $plans = [
            ['code' => 'starter', 'name' => 'Starter', 'pool_gb' => 10, 'ceiling_gb' => 25, 'price_ngn_monthly' => 110000, 'price_ngn_yearly' => 1200000, 'price_usd_monthly' => 150, 'price_usd_yearly' => 1200, 'featured' => false, 'sort' => 1],
            ['code' => 'business', 'name' => 'Business', 'pool_gb' => 30, 'ceiling_gb' => 100, 'price_ngn_monthly' => 250000, 'price_ngn_yearly' => 2760000, 'price_usd_monthly' => 350, 'price_usd_yearly' => 3000, 'featured' => true, 'sort' => 2],
            ['code' => 'premium', 'name' => 'Premium', 'pool_gb' => 100, 'ceiling_gb' => null, 'price_ngn_monthly' => 500000, 'price_ngn_yearly' => 5400000, 'price_usd_monthly' => 700, 'price_usd_yearly' => 6000, 'featured' => false, 'sort' => 3],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['code' => $plan['code']], $plan + ['extra_block_gb' => 10, 'extra_price_ngn_yearly' => 600000, 'extra_price_usd_yearly' => 1200]);
        }
    }
}
