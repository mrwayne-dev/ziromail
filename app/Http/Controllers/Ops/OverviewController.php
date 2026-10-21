<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityItemResource;
use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The staff landing page. Every figure here is counted from our own tables; anything that
 * needs the mail server (volume, bounces, queue, blocklists, backups, support) is sent as
 * null so the page says "not connected" instead of showing a made-up number.
 */
class OverviewController extends Controller
{
    public function __invoke(): Response
    {
        // Counted at most once a minute: opening the console never runs these queries per request.
        $figures = Cache::remember('ops.overview.figures', 60, fn () => [
            'users' => User::query()->count(),
            'usersWeek' => User::query()->where('created_at', '>=', now()->subWeek())->count(),
            'mailboxes' => Mailbox::query()->count(),
            'mailboxesWeek' => Mailbox::query()->where('created_at', '>=', now()->subWeek())->count(),
            'domains' => Domain::query()->count(),
            'liveDomains' => Domain::query()->where('state', 'live')->count(),
            'assignedGb' => round((float) Mailbox::query()->sum('quota_gb'), 1),
            'usedGb' => round((float) Mailbox::query()->sum('used_gb'), 1),
        ]);

        $stuck = Domain::query()->with(['user', 'subscription', 'records'])->where('state', '!=', 'live')->oldest()->limit(5)->get()
            ->map(fn (Domain $d) => [
                'domain' => $d->name,
                'ownerId' => $d->user->id,
                'organisation' => $d->user->business_name ?? $d->user->name,
                'missing' => $d->records->where('status', '!=', 'passing')->pluck('type')->values(),
                'daysWaiting' => (int) $d->created_at->diffInDays(now()),
                'paid' => $d->subscription?->status !== 'incomplete',
            ]);

        return Inertia::render('Ops/Index', [
            'figures' => $figures,
            'stuckDomains' => $stuck,
            'feed' => ActivityItemResource::collection(AuditLog::query()->whereNotNull('summary')->latest('id')->limit(6)->get())->resolve(),
        ]);
    }
}
