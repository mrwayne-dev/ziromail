<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'number' => 'ZIRO-'.now()->year.'-'.fake()->unique()->numerify('####'),
            'issued_at' => now()->toDateString(),
            'description' => 'Starter plan, 1 year',
            'currency' => 'NGN',
            'net' => 1200000,
            'vat' => 90000,
            'total' => 1290000,
            'status' => 'paid',
        ];
    }
}
