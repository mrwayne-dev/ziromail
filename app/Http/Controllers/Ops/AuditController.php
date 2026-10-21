<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Identity\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Everything anyone did, newest first. Append-only: this page only reads. Entries
 * carry what the server recorded (never a secret, never mail content).
 */
class AuditController extends Controller
{
    private const PAGE = 40;

    private const KINDS = ['all', 'sign-in', 'account', 'access', 'staff'];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $kind = in_array($request->query('kind'), self::KINDS, true) ? $request->query('kind') : 'all';
        $who = (string) $request->query('who', 'any');
        $before = (int) $request->query('before', 0);

        $rows = AuditLog::query()
            ->when($before > 0, fn (Builder $query) => $query->where('id', '<', $before))
            ->when($kind === 'sign-in', fn (Builder $query) => $query->where('action', 'like', 'auth.%'))
            ->when($kind === 'account', fn (Builder $query) => $query->whereNotNull('summary'))
            ->when($kind === 'access', fn (Builder $query) => $query->where('action', 'like', 'access.%'))
            ->when($kind === 'staff', fn (Builder $query) => $query->where('actor_type', 'staff'))
            ->when($who === 'system', fn (Builder $query) => $query->where('actor_type', 'system'))
            ->when(str_starts_with($who, 'staff:'), fn (Builder $query) => $query->where('actor_type', 'staff')->where('actor_id', (int) substr($who, 6)))
            ->when($q !== '', function (Builder $query) use ($q) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $q).'%';
                $query->where(fn (Builder $w) => $w->where('action', 'like', $like)->orWhere('summary', 'like', $like)->orWhere('detail', 'like', $like));
            })
            ->latest('id')
            ->limit(self::PAGE + 1)
            ->get();

        $more = $rows->count() > self::PAGE;
        $rows = $rows->take(self::PAGE);

        $staff = Staff::query()->whereIn('id', $rows->where('actor_type', 'staff')->pluck('actor_id'))->pluck('name', 'id');
        $users = User::query()->whereIn('id', $rows->where('actor_type', 'user')->pluck('actor_id'))->get(['id', 'business_name', 'name'])->mapWithKeys(fn ($u) => [$u->id => $u->business_name ?? $u->name]);

        return Inertia::render('Ops/Audit', [
            'filters' => ['q' => $q, 'who' => $who, 'kind' => $kind],
            'people' => Staff::query()->orderBy('name')->get(['id', 'name'])->map(fn ($s) => ['value' => 'staff:'.$s->id, 'label' => $s->name])->values(),
            'entries' => $rows->map(function (AuditLog $row) use ($staff, $users) {
                $action = AuditAction::tryFrom($row->action);

                return [
                    'id' => $row->id,
                    'at' => $row->created_at->toIso8601String(),
                    'actor' => match ($row->actor_type) {
                        'staff' => $staff[$row->actor_id] ?? 'Staff',
                        'user' => $users[$row->actor_id] ?? 'A customer',
                        'system' => 'System',
                        default => 'Not signed in',
                    },
                    'kind' => $row->actor_type === 'staff' ? 'staff' : (str_starts_with($row->action, 'auth.') ? 'sign-in' : (str_starts_with($row->action, 'access.') ? 'access' : 'account')),
                    'text' => $action?->label() ?? $row->action,
                    'detail' => $row->summary ? str_replace('*', '', $row->summary) : $row->detail,
                    'reason' => $row->metadata['reason'] ?? null,
                    'grave' => in_array($row->action, ['auth.lockout', 'auth.two_factor_disabled', 'access.delegation_withdrawn'], true),
                ];
            })->values(),
            'nextBefore' => $more ? $rows->last()->id : null,
        ]);
    }
}
