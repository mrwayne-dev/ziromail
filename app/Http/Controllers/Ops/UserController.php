<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityItemResource;
use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff view of customer accounts. Sizes, states and billing facts only: no message,
 * subject or address a customer mailed is stored anywhere, so none can be shown.
 */
class UserController extends Controller
{
    private const PER_PAGE = 25;

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));

        $users = User::query()
            ->with(['domains.subscription.plan', 'domains.mailboxes'])
            ->when($q !== '', fn (Builder $query) => $query->where(function (Builder $w) use ($q) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $q).'%';
                $w->where('business_name', 'like', $like)->orWhere('name', 'like', $like)->orWhere('email', 'like', $like)
                    ->orWhereHas('domains', fn (Builder $d) => $d->where('name', 'like', $like)
                        ->orWhereHas('mailboxes', fn (Builder $m) => $m->whereRaw("concat(local_part, '@', domains.name) like ?", [$like])));
            }))
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('Ops/Users', [
            'query' => $q,
            'rows' => $users->getCollection()->map(fn (User $user) => $this->row($user))->values(),
            'page' => ['current' => $users->currentPage(), 'last' => $users->lastPage(), 'total' => $users->total()],
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['domains.subscription.plan', 'domains.mailboxes', 'domains.records', 'invoices']);

        return Inertia::render('Ops/User', [
            'user' => [
                ...$this->row($user),
                'phone' => $user->phone,
                'emailVerified' => $user->hasVerifiedEmail(),
                'twoFactorEnabled' => $user->hasConfirmedTwoFactor(),
                'lastLoginAt' => $user->last_login_at?->toIso8601String(),
                'paidToDateMinor' => (int) $user->invoices->where('status', 'paid')->sum('total'),
                'invoiceCount' => $user->invoices->count(),
            ],
            'domains' => $user->domains->map(fn (Domain $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'state' => $d->state,
                'registrar' => $d->registrar,
                'plan' => $d->subscription?->plan->name,
                'subscriptionStatus' => $d->subscription?->status,
                'renewsAt' => $d->subscription?->renews_at?->toDateString(),
                'poolGb' => $d->subscription ? $d->poolGb() : 0,
                'assignedGb' => $d->assignedGb(),
                'usedGb' => $d->usedGb(),
                'records' => $d->records->mapWithKeys(fn ($r) => [$r->type => $r->status === 'passing' ? 'ok' : 'no'])->all(),
                'mailboxes' => $d->mailboxes->map(fn ($m) => [
                    'address' => $m->local_part.'@'.$d->name, 'quotaGb' => $m->quota_gb, 'usedGb' => $m->used_gb,
                    'lastLoginAt' => $m->last_login_at?->toIso8601String(), 'state' => $m->state, 'provisioning' => $m->provisioning_state,
                ])->values(),
            ])->values(),
            'activity' => ActivityItemResource::collection(AuditLog::query()->where('account_id', $user->id)->whereNotNull('summary')->latest('id')->limit(10)->get())->resolve(),
        ]);
    }

    /** @return array<string, mixed> */
    private function row(User $user): array
    {
        $domains = $user->domains;
        $live = $domains->where('state', 'live')->count();

        return [
            'id' => $user->id,
            'business' => $user->business_name ?? $user->name,
            'name' => $user->name,
            'email' => $user->email,
            'createdAt' => $user->created_at->toIso8601String(),
            'domains' => $domains->map(fn (Domain $d) => ['id' => $d->id, 'name' => $d->name, 'state' => $d->state])->values(),
            'mailboxCount' => $domains->sum(fn (Domain $d) => $d->mailboxes->count()),
            'usedGb' => round((float) $domains->sum(fn (Domain $d) => $d->usedGb()), 1),
            'poolGb' => (int) $domains->sum(fn (Domain $d) => $d->subscription ? $d->poolGb() : 0),
            'state' => match (true) {
                $domains->isEmpty() => 'no_domain',
                $live === 0 => 'setup_incomplete',
                $domains->contains(fn (Domain $d) => $d->subscription?->status === 'past_due') => 'payment_overdue',
                default => 'healthy',
            },
        ];
    }
}
