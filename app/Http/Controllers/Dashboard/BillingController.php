<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\DomainSummaryResource;
use App\Http\Resources\PlanResource;
use App\Models\Invoice;
use App\Models\Plan;
use App\Services\AccountContext;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __invoke(AccountContext $account): Response|RedirectResponse
    {
        $domain = $account->current();
        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }

        $subscription = $domain->subscription;
        abort_if($subscription === null, 404);
        $summary = (new DomainSummaryResource($domain))->resolve();

        return Inertia::render('Dashboard/Billing', [
            'domain' => $summary,
            'subscription' => [
                'status' => $subscription->status,
                'term' => $subscription->term,
                'planCode' => $subscription->plan->code,
                'renewsAt' => $subscription->renews_at?->toDateString(),
                'paidBy' => $subscription->paid_by,
                'extraStorageGb' => $subscription->extra_storage_gb,
                'currency' => $subscription->currency,
                'priceNet' => $subscription->price_net,
                'vat' => $subscription->vat,
            ],
            'plan' => (new PlanResource($subscription->plan))->resolve(),
            'plans' => PlanResource::collection(Plan::query()->where('active', true)->orderBy('sort')->get())->resolve(),
            'invoices' => Invoice::query()->where('user_id', $account->owner()->getKey())->where('domain_id', $domain->id)->latest('issued_at')->get()->map(fn (Invoice $i) => [
                'id' => $i->id, 'number' => $i->number, 'issuedAt' => $i->issued_at->toDateString(), 'description' => $i->description,
                'total' => ['minor' => $i->total, 'currency' => $i->currency], 'status' => $i->status, 'pdfAvailable' => false,
            ])->values(),
            'storage' => [
                'poolGb' => $summary['poolGb'], 'planGb' => $summary['planGb'], 'boughtGb' => $summary['boughtGb'], 'ceilingGb' => $summary['ceilingGb'],
                'assignedGb' => $summary['assignedGb'], 'usedGb' => $summary['usedGb'], 'extra' => ['blockGb' => $subscription->plan->extra_block_gb, 'mode' => 'block'],
            ],
            'paymentMethod' => ['channel' => $subscription->paid_by],
            // Changing plan and buying storage need the payment provider, which is not connected yet.
            'can' => ['changePlan' => $account->isOwner(), 'buyStorage' => $account->isOwner(), 'paymentsConnected' => false],
        ]);
    }
}
