<?php

namespace App\Services\Dashboard;

use App\Events\AccountChanged;
use App\Events\OpsChanged;
use App\Http\Requests\Dashboard\StoreDomainRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Domain;
use App\Models\Plan;
use App\Models\User;
use App\Services\Dns\ExpectedRecords;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Adds a domain to an account: the row, its four expected records and an unpaid subscription.
 * The dashboard and the onboarding wizard both come through here so the rules cannot drift.
 */
class DomainCreator
{
    public function __construct(private ExpectedRecords $expected, private AuditLogger $audit) {}

    /**
     * @param  iterable<Domain>  $existing  the account's own domains
     *
     * @throws ValidationException with the one neutral message when the name cannot be added
     */
    public function create(User $owner, User $actor, string $name, Plan $plan, iterable $existing): Domain
    {
        foreach ($existing as $domain) {
            if ($domain->name === $name) {
                throw ValidationException::withMessages(['name' => StoreDomainRequest::NEUTRAL]);
            }
        }

        // Held live by another account: the same answer as a typo.
        if (Domain::query()->where('live_name', $name)->exists()) {
            throw ValidationException::withMessages(['name' => StoreDomainRequest::NEUTRAL]);
        }

        $domain = DB::transaction(function () use ($owner, $name, $plan) {
            $domain = new Domain(['name' => $name]);
            $domain->user_id = $owner->id;
            $domain->save();

            foreach ($this->expected->for($name) as $type => $values) {
                $domain->records()->forceCreate(['type' => $type, 'status' => 'waiting', 'expected' => $values]);
            }

            // No payment yet, so the subscription is `incomplete` and the domain cannot go live.
            $price = $plan->price('NGN', 'annual');
            $domain->subscription()->forceCreate([
                'plan_id' => $plan->id, 'term' => 'annual', 'status' => 'incomplete', 'currency' => 'NGN',
                'price_net' => $price, 'vat' => (int) round($price * 0.075),
            ]);

            return $domain;
        });

        AccountChanged::for($owner, 'domain');
        OpsChanged::fire('users');
        $this->audit->account(AuditAction::DomainAdded, $owner, 'domain', 'You added *'.$name.'*', $actor, 'On the '.$plan->name.' plan, awaiting payment and DNS records', $domain);

        return $domain;
    }
}
