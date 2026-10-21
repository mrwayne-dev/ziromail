<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\DomainRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DomainRecord>
 */
class DomainRecordFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'domain_id' => Domain::factory(),
            'type' => 'MX',
            'status' => 'passing',
            'expected' => ['host' => '@', 'value' => 'mx.ziroemail.com', 'priority' => 10],
        ];
    }
}
