<?php

namespace Database\Factories;

use App\Models\Alias;
use App\Models\Domain;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Alias>
 */
class AliasFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'domain_id' => Domain::factory(),
            'local_part' => fake()->unique()->word(),
            'destinations' => ['info'],
        ];
    }
}
