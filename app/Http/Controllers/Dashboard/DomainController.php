<?php

namespace App\Http\Controllers\Dashboard;

use App\Events\AccountChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreDomainRequest;
use App\Http\Resources\DomainRecordResource;
use App\Http\Resources\DomainSummaryResource;
use App\Models\Plan;
use App\Services\AccountContext;
use App\Services\Dashboard\DomainCreator;
use App\Services\Dns\DnsChecker;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DomainController extends Controller
{
    public function index(AccountContext $account): Response
    {
        return Inertia::render('Dashboard/Domains', [
            'domains' => DomainSummaryResource::collection($account->domains())->resolve(),
            'canAddDomain' => $account->isOwner(),
        ]);
    }

    public function show(string $domain, AccountContext $account): Response
    {
        $domain = $account->domain($domain);

        return Inertia::render('Dashboard/Domain', [
            'domain' => [...(new DomainSummaryResource($domain))->resolve(), 'registrar' => $domain->registrar],
            'records' => DomainRecordResource::collection($domain->records->sortBy(fn ($r) => array_search($r->type, ['MX', 'SPF', 'DKIM', 'DMARC']))->values())->resolve(),
            'checkedAt' => $domain->records->max('last_checked_at')?->toIso8601String(),
            // Inbox placement and sending reputation need delivery data we do not collect yet: shown as "not enough data", never invented.
            'placement' => null,
            'reputation' => null,
        ]);
    }

    public function store(StoreDomainRequest $request, AccountContext $account, DomainCreator $creator): RedirectResponse
    {
        abort_unless($account->isOwner(), 403);

        $plan = Plan::query()->where('code', $request->string('plan'))->where('active', true)->firstOrFail();
        $domain = $creator->create($account->owner(), $request->user(), $request->string('name')->toString(), $plan, $account->domains());

        return redirect()->route('dashboard.domains.show', ['domain' => $domain->id])->with('status', 'domain-added');
    }

    public function recheck(string $domain, AccountContext $account, DnsChecker $dns): RedirectResponse
    {
        $domain = $account->domain($domain);
        $checked = false;

        foreach ($domain->records as $record) {
            $result = $dns->check($domain->name, $record->type, $record->expected);
            if ($result['status'] === 'unchecked') {
                continue;
            }
            $record->forceFill(['status' => $result['status'], 'observed' => $result['observed'], 'last_checked_at' => now()])->save();
            $checked = true;
        }

        if ($checked) {
            AccountChanged::for($account->owner(), 'domain');
        }

        return back()->with('status', $checked ? 'rechecked' : 'dns-unavailable');
    }
}
