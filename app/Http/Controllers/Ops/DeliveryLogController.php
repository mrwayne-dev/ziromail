<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\DeliveryStat;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Hourly delivery outcomes per customer domain and recipient provider. There is deliberately no
 * per-message view: subjects, recipients and message ids are not kept, so "did it send?" is
 * answered at the level of "is mail reaching Gmail from this domain?".
 */
class DeliveryLogController extends Controller
{
    private const PERIODS = ['1h' => 1, '24h' => 24, '7d' => 168, '30d' => 720];

    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'in:any,delivered,deferred,bounced,rejected'],
            'period' => ['nullable', 'in:1h,24h,7d,30d'],
        ]);
        $state = $filters['state'] ?? 'any';
        $period = $filters['period'] ?? '24h';
        $q = trim((string) ($filters['q'] ?? ''));

        $query = DeliveryStat::query()->with('domain')->where('hour', '>=', now()->subHours(self::PERIODS[$period]))
            ->when($state !== 'any', fn ($builder) => $builder->where($state, '>', 0))
            ->when($q !== '', function ($builder) use ($q) {
                $like = '%'.addcslashes(mb_strtolower($q), '%_\\').'%';
                $builder->where(fn ($inner) => $inner->where('recipient_domain', 'like', $like)->orWhereHas('domain', fn ($domain) => $domain->where('name', 'like', $like)));
            });

        $totals = (clone $query)->selectRaw('COALESCE(SUM(delivered),0) AS delivered, COALESCE(SUM(deferred),0) AS deferred, COALESCE(SUM(bounced),0) AS bounced, COALESCE(SUM(rejected),0) AS rejected')->first();

        return Inertia::render('Ops/Queue', [
            'filters' => ['q' => $q, 'state' => $state, 'period' => $period],
            'totals' => ['delivered' => (int) $totals->delivered, 'deferred' => (int) $totals->deferred, 'bounced' => (int) $totals->bounced, 'rejected' => (int) $totals->rejected],
            'rows' => $query->latest('hour')->limit(200)->get()->map(fn (DeliveryStat $stat) => [
                'id' => $stat->id, 'at' => $stat->hour->toIso8601String(), 'domain' => $stat->domain->name, 'recipientDomain' => $stat->recipient_domain,
                'delivered' => $stat->delivered, 'deferred' => $stat->deferred, 'bounced' => $stat->bounced, 'rejected' => $stat->rejected, 'replyCode' => $stat->reply_code,
            ])->values(),
        ]);
    }
}
