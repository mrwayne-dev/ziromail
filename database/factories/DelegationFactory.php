<?php

namespace Database\Factories;

use App\Models\Delegation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Delegation>
 */
class DelegationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'grantee_name' => fake()->company(),
            'scope' => 'Agency access to the domain records',
        ];
    }
}
