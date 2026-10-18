<?php

namespace Database\Factories;

use App\Identity\Enums\AuditAction;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'actor_type' => 'user',
            'actor_id' => fake()->numberBetween(1, 50),
            'action' => fake()->randomElement(AuditAction::cases())->value,
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'metadata' => null,
        ];
    }
}
