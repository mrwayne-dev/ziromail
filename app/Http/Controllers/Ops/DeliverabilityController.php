<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\DeliveryStat;
use App\Models\Domain;
use App\Models\DomainRecord;
use App\Models\SendingStat;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Platform delivery health from the hourly counts the mail server reports. Blocklists, inbox
 * placement and queue age need the mail server itself and are sent as null so the page says
 * "not connected" rather than showing a figure nobody measured.
 */
class DeliverabilityController extends Controller
{
    public function __invoke(): Response
    {
        $data = Cache::remember('ops.deliverability', 60, fn () => $this->figures());

        return Inertia::render('Ops/Deliverability', $data + [
            'limits' => ['bounceLimitPct' => 2.0, 'complaintLimitPct' => 0.10],
        ]);
    }

    /** @return array<string, mixed> */
    private function figures(): array
    {
        $day = DeliveryStat::query()->where('hour', '>=', now()->subDay())
            ->selectRaw('COALESCE(SUM(delivered),0) AS delivered, COALESCE(SUM(deferred),0) AS deferred, COALESCE(SUM(bounced),0) AS bounced, COALESCE(SUM(rejected),0) AS rejected')->first();
        $total = $day->delivered + $day->deferred + $day->bounced + $day->rejected;

        $sending = SendingStat::query()->where('hour', '>=', now()->subDay())
            ->selectRaw('COALESCE(SUM(sent),0) AS sent, COALESCE(SUM(complaints),0) AS complaints')->first();

        $series = DeliveryStat::query()->where('hour', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(hour) AS day, SUM(delivered)+SUM(deferred)+SUM(bounced)+SUM(rejected) AS total, SUM(bounced)+SUM(rejected) AS failed')
            ->groupBy('day')->orderBy('day')->get()
            ->filter(fn ($row) => $row->total > 0)
            ->map(fn ($row) => ['label' => date('j M', strtotime($row->day)), 'value' => round($row->failed / $row->total * 100, 1)])->values();

        $worst = DeliveryStat::query()->where('hour', '>=', now()->subDays(7))
            ->selectRaw('domain_id, SUM(delivered)+SUM(deferred)+SUM(bounced)+SUM(rejected) AS total, SUM(bounced)+SUM(rejected) AS failed')
            ->groupBy('domain_id')->havingRaw('total >= 50')->orderByRaw('failed / total DESC')->limit(5)->get();
        $domains = Domain::query()->with('user')->whereIn('id', $worst->pluck('domain_id'))->get()->keyBy('id');

        $liveOrAll = Domain::query()->count();
        $passing = fn (string $type) => DomainRecord::query()->where('type', $type)->where('status', 'passing')->distinct()->count('domain_id');

        return [
            'connected' => $total > 0,
            'headline' => [
                'bouncePct' => $total > 0 ? round(($day->bounced + $day->rejected) / $total * 100, 1) : null,
                'complaintPct' => $sending->sent > 0 ? round($sending->complaints / $sending->sent * 100, 2) : null,
                'deferred24h' => $total > 0 ? (int) $day->deferred : null,
                'sent24h' => $total > 0 ? (int) $total : null,
            ],
            // Cache stores a PHP-serialized value, and a Laravel Collection round-trips
            // badly across autoloader changes — it comes back as an __PHP_Incomplete_Class
            // stub that JSON-encodes to `{}` and crashes `.reduce` in the browser. Flatten
            // to plain arrays before caching so the cache row stores pure data.
            'bounceSeries' => $series->values()->all(),
            'worstDomains' => $worst->map(fn ($row) => [
                'domain' => $domains[$row->domain_id]->name,
                'ownerId' => $domains[$row->domain_id]->user_id,
                'sent7d' => (int) $row->total,
                'bouncePct' => round($row->failed / $row->total * 100, 1),
            ])->values()->all(),
            'authCoverage' => [
                ['Domains with SPF', $passing('SPF').' / '.$liveOrAll],
                ['Domains with DKIM', $passing('DKIM').' / '.$liveOrAll],
                ['Domains with DMARC', $passing('DMARC').' / '.$liveOrAll],
            ],
            'blocklists' => null,
            'placement' => null,
        ];
    }
}
