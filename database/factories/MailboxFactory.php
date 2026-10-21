<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\Mailbox;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mailbox>
 */
class MailboxFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'domain_id' => Domain::factory(),
            'local_part' => fake()->unique()->userName(),
            'quota_gb' => 2,
            'role_label' => 'Staff',
        ];
    }
}
