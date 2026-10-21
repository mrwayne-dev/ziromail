<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\AbuseFlag;
use App\Models\Mailbox;
use Inertia\Inertia;
use Inertia\Response;

/** What the sending bot looks at, what it may do on its own, and what it has done lately. Read-only: thresholds change in config, in a reviewed commit. */
class SpamRulesController extends Controller
{
    public function __invoke(): Response
    {
        $since = now()->subDays(30);

        return Inertia::render('Ops/SpamRules', [
            'rules' => config('abuse'),
            'weeks' => collect(range(7, 0))->map(function (int $ago) {
                $from = now()->startOfWeek()->subWeeks($ago);
                $flags = AbuseFlag::query()->whereBetween('created_at', [$from, $from->copy()->addWeek()]);

                return [
                    'label' => $from->format('j M'),
                    'flagged' => (clone $flags)->count(),
                    'autoActed' => (clone $flags)->whereIn('auto_action', ['limited', 'locked'])->count(),
                    'wouldHave' => (clone $flags)->whereIn('auto_action', ['would_limit', 'would_lock'])->count(),
                    'cleared' => AbuseFlag::query()->where('outcome', 'cleared')->whereBetween('resolved_at', [$from, $from->copy()->addWeek()])->count(),
                ];
            })->values(),
            'activity' => [
                'flagged' => AbuseFlag::query()->where('created_at', '>=', $since)->count(),
                'autoLimited' => AbuseFlag::query()->where('created_at', '>=', $since)->where('auto_action', 'limited')->count(),
                'autoLocked' => AbuseFlag::query()->where('created_at', '>=', $since)->where('auto_action', 'locked')->count(),
                'cleared' => AbuseFlag::query()->where('resolved_at', '>=', $since)->where('outcome', 'cleared')->count(),
                'currentlyRestricted' => Mailbox::query()->where('sending_state', '!=', 'normal')->count(),
            ],
        ]);
    }
}
