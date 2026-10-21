<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A plan is data, so a price can change without a deploy. Money is integer minor units.
 */
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $guarded = ['id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['featured' => 'boolean', 'active' => 'boolean'];
    }

    /** Price in minor units for a currency and term ('annual' or 'monthly'). */
    public function price(string $currency, string $term): int
    {
        return (int) $this->getAttribute('price_'.strtolower($currency).'_'.($term === 'annual' ? 'yearly' : 'monthly'));
    }

    public function extraPrice(string $currency): int
    {
        return (int) $this->getAttribute('extra_price_'.strtolower($currency).'_yearly');
    }
}
