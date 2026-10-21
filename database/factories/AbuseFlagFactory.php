<?php

namespace Database\Factories;

use App\Models\AbuseFlag;
use App\Models\Mailbox;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AbuseFlag>
 */
class AbuseFlagFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mailbox_id' => Mailbox::factory(),
            'severity' => 'medium',
            'rules' => ['bounce'],
            'evidence' => ['sent' => 100, 'bounced' => 20, 'complaints' => 0, 'baselinePerHour' => 2.0],
            'auto_action' => 'none',
        ];
    }
}
