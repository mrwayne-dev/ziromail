<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Domain>
 */
class DomainFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->unique()->domainName(),
            'registrar' => 'Whogohost',
        ];
    }

    /** A verified domain that holds its name. */
    public function live(): static
    {
        return $this->afterCreating(fn (Domain $domain) => $domain->goLive());
    }

    /** With a subscription on `$plan` (a new one when null), `$extraGb` of bought storage. */
    public function withSubscription(?Plan $plan = null, int $extraGb = 0): static
    {
        return $this->afterCreating(function (Domain $domain) use ($plan, $extraGb) {
            $plan ??= Plan::factory()->create();
            Subscription::factory()->create(['domain_id' => $domain->id, 'plan_id' => $plan->id, 'extra_storage_gb' => $extraGb]);
        });
    }
}
