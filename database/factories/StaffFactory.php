<?php

namespace Database\Factories;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'support',
        ];
    }

    public function owner(): static
    {
        return $this->state(fn () => ['role' => 'owner']);
    }

    public function withTwoFactor(string $secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'): static
    {
        return $this->state(fn () => ['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()]);
    }
}
