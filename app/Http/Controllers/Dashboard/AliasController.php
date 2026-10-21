<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SaveAliasRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Alias;
use App\Models\Domain;
use App\Services\AccountContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AliasController extends Controller
{
    public function index(AccountContext $account): Response|RedirectResponse
    {
        $domain = $account->current();
        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }

        return Inertia::render('Dashboard/Aliases', [
            'domain' => ['id' => $domain->id, 'name' => $domain->name],
            'aliases' => $domain->aliases->map(fn (Alias $alias) => $this->row($alias, $domain))->values(),
            'mailboxes' => $domain->mailboxes->map(fn ($m) => ['id' => $m->id, 'address' => $m->local_part.'@'.$domain->name])->values(),
            'catchAll' => ['on' => false],
        ]);
    }

    public function store(SaveAliasRequest $request, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        $domain = $account->domain($request->string('domain')->toString());
        $alias = new Alias;
        $alias->domain_id = $domain->id;

        return $this->save($alias, $domain, $request, $account, $audit, 'You added *%s*');
    }

    public function update(SaveAliasRequest $request, string $alias, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        [$alias, $domain] = $this->owned($account, $alias);

        return $this->save($alias, $domain, $request, $account, $audit, 'You changed *%s*');
    }

    public function destroy(string $alias, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        [$alias, $domain] = $this->owned($account, $alias);
        $address = $alias->local_part.'@'.$domain->name;
        $alias->delete();
        $audit->account(AuditAction::AliasRemoved, $account->owner(), 'mailboxes', 'You removed *'.$address.'*', request()->user());

        return back()->with('status', 'alias-removed');
    }

    private function save(Alias $alias, Domain $domain, SaveAliasRequest $request, AccountContext $account, AuditLogger $audit, string $summary): RedirectResponse
    {
        $local = mb_strtolower($request->string('local_part')->toString());
        $targets = collect($request->input('destinations'))->map(fn ($d) => mb_strtolower(explode('@', (string) $d)[0]))->unique()->values();
        $known = $domain->mailboxes->pluck('local_part');

        if ($domain->mailboxes->contains('local_part', $local)) {
            throw ValidationException::withMessages(['local_part' => 'A mailbox already uses this address.']);
        }
        if (Alias::query()->where('domain_id', $domain->id)->where('local_part', $local)->when($alias->exists, fn ($q) => $q->whereKeyNot($alias->id))->exists()) {
            throw ValidationException::withMessages(['local_part' => 'This address is already in use.']);
        }
        if ($targets->diff($known)->isNotEmpty()) {
            throw ValidationException::withMessages(['destinations' => 'Choose mailboxes that exist on this domain.']);
        }

        $alias->local_part = $local;
        $alias->destinations = $targets->all();
        $alias->save();
        $audit->account(AuditAction::AliasSaved, $account->owner(), 'mailboxes', sprintf($summary, $local.'@'.$domain->name), $request->user(), 'Delivers to '.$targets->implode(', '), $alias);

        return back()->with('status', 'alias-saved');
    }

    /** @return array{0: Alias, 1: Domain} */
    private function owned(AccountContext $account, string $id): array
    {
        foreach ($account->domains() as $domain) {
            if ($alias = $domain->aliases->firstWhere('id', $id)) {
                return [$alias, $domain];
            }
        }

        abort(404);
    }

    /** @return array<string, mixed> */
    private function row(Alias $alias, Domain $domain): array
    {
        return [
            'id' => $alias->id,
            'address' => $alias->local_part.'@'.$domain->name,
            'destinations' => collect($alias->destinations)->map(fn ($d) => $d.'@'.$domain->name)->all(),
            'type' => count($alias->destinations) > 1 ? 'forward' : 'alias',
        ];
    }
}
