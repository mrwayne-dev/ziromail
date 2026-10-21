<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Every domain on the platform and who holds it. */
class DomainController extends Controller
{
    private const PER_PAGE = 25;

    private const FILTERS = ['all', 'live', 'pending', 'broken'];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $filter = in_array($request->query('filter'), self::FILTERS, true) ? $request->query('filter') : 'all';

        $domains = Domain::query()
            ->with(['user', 'subscription.plan', 'records'])
            ->when($q !== '', function (Builder $query) use ($q) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $q).'%';
                $query->where(fn (Builder $w) => $w->where('name', 'like', $like)
                    ->orWhereHas('user', fn (Builder $u) => $u->where('email', 'like', $like)->orWhere('business_name', 'like', $like)->orWhere('name', 'like', $like)));
            })
            ->when($filter === 'live', fn (Builder $query) => $query->where('state', 'live'))
            ->when($filter === 'pending', fn (Builder $query) => $query->where('state', '!=', 'live'))
            ->when($filter === 'broken', fn (Builder $query) => $query->where('state', 'live')->whereHas('records', fn (Builder $r) => $r->where('status', '!=', 'passing')))
            ->orderBy('name')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('Ops/Domains', [
            'query' => $q,
            'filter' => $filter,
            'counts' => [
                'all' => Domain::query()->count(),
                'live' => Domain::query()->where('state', 'live')->count(),
                'pending' => Domain::query()->where('state', '!=', 'live')->count(),
                'broken' => Domain::query()->where('state', 'live')->whereHas('records', fn (Builder $r) => $r->where('status', '!=', 'passing'))->count(),
            ],
            'rows' => $domains->getCollection()->map(fn (Domain $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'state' => $d->state,
                'registrar' => $d->registrar,
                'plan' => $d->subscription?->plan->name,
                'subscriptionStatus' => $d->subscription?->status,
                'ownerId' => $d->user->id,
                'owner' => $d->user->business_name ?? $d->user->name,
                'ownerEmail' => $d->user->email,
                'records' => $d->records->mapWithKeys(fn ($r) => [$r->type => $r->status === 'passing' ? 'ok' : 'no'])->all(),
                'addedAt' => $d->created_at->toIso8601String(),
                // A name several accounts are claiming: only one can be live, the others are pending.
                'contested' => $d->state !== 'live' && Domain::query()->where('name', $d->name)->count() > 1,
            ])->values(),
            'page' => ['current' => $domains->currentPage(), 'last' => $domains->lastPage(), 'total' => $domains->total()],
        ]);
    }
}
