<?php

namespace App\Services;

use App\Models\Domain;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Whose data this request is about. A customer sees their own account; an admin the owner
 * invited (accepted, not revoked) sees the owner's. Every dashboard query starts from the
 * domains here, so another account's ids simply do not exist for the request: they 404.
 * Registered as a scoped binding, so one request runs these queries once.
 */
class AccountContext
{
    private ?User $owner = null;

    /** @var Collection<int, Domain>|null */
    private ?Collection $domains = null;

    private ?\WeakReference $requestRef = null;

    public function __construct(private Request $request) {}

    /** Caches live for one request only: a new request object (a test, a queue worker, Octane) starts clean. */
    private function request(): Request
    {
        $current = app('request');
        if ($this->requestRef?->get() !== $current) {
            $this->requestRef = \WeakReference::create($current);
            $this->request = $current;
            $this->owner = null;
            $this->domains = null;
        }

        return $this->request;
    }

    public function owner(): User
    {
        $request = $this->request();

        if ($this->owner !== null) {
            return $this->owner;
        }

        $user = $request->user('web');
        abort_if($user === null, 401);

        // A person with an account of their own sees that account. Otherwise an invitation to their
        // verified address (or one they already accepted) opens the inviting owner's account.
        $membership = null;
        if (! Domain::query()->where('user_id', $user->getKey())->exists()) {
            $membership = TeamMember::query()
                ->whereNull('revoked_at')
                ->where(fn ($q) => $q->where('member_id', $user->getKey())
                    ->when($user->hasVerifiedEmail(), fn ($q) => $q->orWhere('email', mb_strtolower($user->email))))
                ->with('owner')
                ->first();

            if ($membership !== null && $membership->accepted_at === null) {
                $membership->forceFill(['member_id' => $user->getKey(), 'accepted_at' => now()])->save();
            }
        }

        return $this->owner = $membership?->owner ?? $user;
    }

    /** True when the signed-in person is the account holder, not an invited admin. */
    public function isOwner(): bool
    {
        return $this->owner()->is($this->request()->user('web'));
    }

    /** @return Collection<int, Domain> */
    public function domains(): Collection
    {
        $this->request();

        return $this->domains ??= Domain::query()
            ->where('user_id', $this->owner()->getKey())
            ->with(['subscription.plan', 'mailboxes', 'records'])
            ->orderBy('created_at')
            ->get();
    }

    /** The domain the page is about: `?domain=<id>` if it is one of this account's, else the first. */
    public function current(): ?Domain
    {
        $wanted = $this->request()->query('domain');

        return $this->domains()->firstWhere('id', is_string($wanted) ? $wanted : null) ?? $this->domains()->first();
    }

    /** Resolves a domain id from a route, or 404s if it is not this account's. */
    public function domain(string $id): Domain
    {
        return $this->domains()->firstWhere('id', $id) ?? abort(404);
    }
}
