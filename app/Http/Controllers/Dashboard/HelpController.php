<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\AccountContext;
use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    public function __invoke(AccountContext $account): Response
    {
        $domain = $account->current();

        return Inertia::render('Dashboard/Help', [
            'support' => config('ziroemail.support'),
            'context' => [
                'domain' => $domain?->name,
                'domainId' => $domain?->id,
                'plan' => $domain?->subscription?->plan->name,
                'accountEmail' => $account->owner()->email,
            ],
        ]);
    }
}
