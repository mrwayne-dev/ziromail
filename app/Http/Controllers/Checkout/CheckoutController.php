<?php

namespace App\Http\Controllers\Checkout;

use App\Http\Controllers\Controller;
use App\Services\AccountContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The order summary for a domain that has not been paid for. Payment itself is not open yet:
 * this page shows the real domain and plan, and takes no money and shows no account number.
 */
class CheckoutController extends Controller
{
    public function __invoke(Request $request, AccountContext $account): Response
    {
        $id = $request->string('domain')->toString();
        $domain = $id !== ''
            ? $account->domain($id)
            : $account->domains()->first(fn ($candidate) => $candidate->subscription?->status === 'incomplete');

        $subscription = $domain?->subscription;

        return Inertia::render('Checkout/Payment', [
            'checkout' => $domain === null || $subscription === null ? null : [
                'domain' => ['id' => $domain->id, 'name' => $domain->name],
                'planCode' => $subscription->plan->code,
                'term' => $subscription->term,
                'currency' => $subscription->currency,
                'paid' => $subscription->status !== 'incomplete',
            ],
        ]);
    }
}
