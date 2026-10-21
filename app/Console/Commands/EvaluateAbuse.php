<?php

namespace App\Console\Commands;

use App\Models\Mailbox;
use App\Models\SendingStat;
use App\Services\Abuse\AbuseEvaluator;
use Illuminate\Console\Command;

class EvaluateAbuse extends Command
{
    protected $signature = 'abuse:evaluate';

    protected $description = 'Look at the last two hours of sending counts and flag mailboxes that look unlike themselves';

    public function handle(AbuseEvaluator $evaluator): int
    {
        $since = now()->subHours(2)->startOfHour();
        $flagged = 0;

        // Only mailboxes that actually sent something recently are looked at.
        $ids = SendingStat::query()->where('hour', '>=', $since)->distinct()->pluck('mailbox_id');
        Mailbox::query()->with('domain.user')->whereIn('id', $ids)->each(function (Mailbox $mailbox) use ($evaluator, &$flagged) {
            foreach ([now()->subHour(), now()] as $hour) {
                if ($evaluator->evaluate($mailbox, $hour) !== null) {
                    $flagged++;
                }
            }
        });

        $this->info('Checked '.count($ids)." mailboxes, {$flagged} flagged.");

        return self::SUCCESS;
    }
}
