<?php

namespace Tests\Feature;

use App\Models\Plan;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlanCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_share_prices_from_the_plans_table(): void
    {
        $this->seed(PlanSeeder::class);
        Cache::forget('plans.catalog');
        Plan::query()->where('code', Plan::query()->orderBy('sort')->value('code'))->update(['price_ngn_yearly' => 123456]);

        $this->get(route('pricing'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('catalog.0.price.NGN.yearly', 123456)->has('catalog.0.extraStorage.blockGb'));
    }
}
