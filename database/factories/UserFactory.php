<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'business_name' => fake()->company(),
            'phone' => '0803'.fake()->numerify('#######'),
            'terms_accepted_at' => now(),
            'terms_version' => '2026-09',
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * A user with two-factor confirmed. The secret is a fixed test value.
     */
    public function withTwoFactor(string $secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
