<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityItemResource;
use App\Http\Resources\DomainSummaryResource;
use App\Http\Resources\MailboxRowResource;
use App\Models\AuditLog;
use App\Services\AccountContext;
use App\Services\Dashboard\AlertDeriver;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    public function __invoke(AccountContext $account, AlertDeriver $alerts): Response|RedirectResponse
    {
        $domain = $account->current();

        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }

        $owner = $account->owner();
        $subscription = $domain->subscription;
        $summary = (new DomainSummaryResource($domain))->resolve();

        return Inertia::render('Dashboard/Overview', [
            'org' => ['id' => $owner->getKey(), 'name' => $owner->business_name ?? $owner->name, 'owner' => ['name' => $owner->name]],
            'domain' => $summary,
            'stats' => [
                'mailboxCount' => $summary['mailboxCount'],
                'usedGb' => $summary['usedGb'],
                'poolGb' => $summary['poolGb'],
                'assignedGb' => $summary['assignedGb'],
                'planName' => $subscription?->plan->name,
                'renewsAt' => $summary['renewsAt'],
                'recordsPassing' => $summary['recordsPassing'],
                'recordsTotal' => $summary['recordsTotal'],
                'healthNote' => $summary['healthNote'],
            ],
            'alerts' => $alerts->for($domain),
            'mailboxes' => MailboxRowResource::collection($domain->mailboxes->sortByDesc('last_login_at')->values())->resolve(),
            'subscription' => $subscription === null ? null : [
                'status' => $subscription->status,
                'term' => $subscription->term,
                'planName' => $subscription->plan->name,
                'poolGb' => $domain->poolGb(),
                'renewsAt' => $subscription->renews_at?->toDateString(),
                'currency' => $subscription->currency,
                'priceNet' => $subscription->price_net,
            ],
            'activity' => ActivityItemResource::collection(
                AuditLog::query()->where('account_id', $owner->getKey())->whereNotNull('summary')->latest('id')->limit(3)->get()
            )->resolve(),
        ]);
    }
}
