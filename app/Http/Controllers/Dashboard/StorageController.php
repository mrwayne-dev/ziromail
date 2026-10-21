<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Services\AccountContext;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StorageController extends Controller
{
    public function __invoke(AccountContext $account): Response|RedirectResponse
    {
        abort_unless($account->isOwner(), 403);

        $domain = $account->current();
        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }
        $subscription = $domain->subscription;
        abort_if($subscription === null, 404);
        $plan = (new PlanResource($subscription->plan))->resolve();

        return Inertia::render('Dashboard/Storage', [
            'domain' => ['id' => $domain->id, 'name' => $domain->name],
            'pool' => [
                'poolGb' => $domain->poolGb(), 'planGb' => $subscription->plan->pool_gb, 'boughtGb' => $subscription->extra_storage_gb,
                'ceilingGb' => $subscription->plan->ceiling_gb, 'assignedGb' => $domain->assignedGb(), 'usedGb' => $domain->usedGb(), 'unassignedGb' => $domain->unassignedGb(),
            ],
            'plan' => $plan,
            'extraStorage' => ['mode' => 'block', 'blockGb' => $plan['extraStorage']['blockGb'], 'price' => $plan['extraStorage']['price']['NGN']['yearly'], 'vatRate' => 0.075, 'currency' => 'NGN'],
            'renewsAt' => $subscription->renews_at?->toDateString(),
            'presets' => [10, 20, 30],
            'paymentsConnected' => false,
        ]);
    }
}
