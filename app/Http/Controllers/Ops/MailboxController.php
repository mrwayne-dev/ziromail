<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\Mailbox;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Every mailbox on the platform by size, state and last sign-in. Never any content. */
class MailboxController extends Controller
{
    private const PER_PAGE = 30;

    private const FILTERS = ['attention', 'full', 'never', 'suspended', 'all'];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $filter = in_array($request->query('filter'), self::FILTERS, true) ? $request->query('filter') : 'attention';

        $filtered = fn (string $f) => fn (Builder $query) => match ($f) {
            'full' => $query->whereRaw('used_gb >= quota_gb * 0.9'),
            'never' => $query->whereNull('last_login_at'),
            'suspended' => $query->whereIn('state', ['suspended', 'locked']),
            'attention' => $query->where(fn (Builder $w) => $w->whereRaw('used_gb >= quota_gb * 0.75')->orWhereNull('last_login_at')->orWhereIn('state', ['suspended', 'locked'])),
            default => $query,
        };

        $mailboxes = Mailbox::query()
            ->with('domain.user')
            ->tap($filtered($filter))
            ->when($q !== '', function (Builder $query) use ($q) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $q).'%';
                $query->where(fn (Builder $w) => $w->where('local_part', 'like', $like)->orWhereHas('domain', fn (Builder $d) => $d->where('name', 'like', $like)->orWhereHas('user', fn (Builder $u) => $u->where('business_name', 'like', $like))));
            })
            ->orderByRaw('used_gb / quota_gb desc')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        $sizes = Mailbox::query()->orderBy('used_gb')->pluck('used_gb');
        $total = Mailbox::query()->count();

        return Inertia::render('Ops/Mailboxes', [
            'query' => $q,
            'filter' => $filter,
            'counts' => collect(self::FILTERS)->mapWithKeys(fn ($f) => [$f => Mailbox::query()->tap($filtered($f))->count()])->all(),
            'figures' => [
                'total' => $total,
                'active30' => Mailbox::query()->where('last_login_at', '>=', now()->subDays(30))->count(),
                'over90' => Mailbox::query()->whereRaw('used_gb >= quota_gb * 0.9')->count(),
                'never' => Mailbox::query()->whereNull('last_login_at')->count(),
                'suspended' => Mailbox::query()->whereIn('state', ['suspended', 'locked'])->count(),
                'medianGb' => $total === 0 ? null : round((float) $sizes[intdiv($total - 1, 2)], 2),
            ],
            'rows' => $mailboxes->getCollection()->map(fn (Mailbox $m) => [
                'id' => $m->id,
                'address' => $m->local_part.'@'.$m->domain->name,
                'ownerId' => $m->domain->user->id,
                'owner' => $m->domain->user->business_name ?? $m->domain->user->name,
                'usedGb' => (float) $m->used_gb,
                'quotaGb' => (float) $m->quota_gb,
                'lastLoginAt' => $m->last_login_at?->toIso8601String(),
                'state' => $m->state,
                'provisioning' => $m->provisioning_state,
            ])->values(),
            'page' => ['current' => $mailboxes->currentPage(), 'last' => $mailboxes->lastPage(), 'total' => $mailboxes->total()],
        ]);
    }
}
