<?php

namespace Database\Factories;

use App\Models\TwoFactorRecoveryCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TwoFactorRecoveryCode>
 */
class TwoFactorRecoveryCodeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return ['code_hash' => hash('sha256', fake()->unique()->uuid()), 'used_at' => null];
    }
}
