<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreDomainRequest;
use App\Http\Requests\Onboarding\StoreOnboardingMailboxesRequest;
use App\Http\Resources\DomainRecordResource;
use App\Models\Domain;
use App\Models\Plan;
use App\Services\AccountContext;
use App\Services\Dashboard\DomainCreator;
use App\Services\Dashboard\MailboxCreator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The setup wizard. Each step reads and writes the account's own rows; the domain travels
 * between steps as its public id, so a refresh or a second device picks up where it left off.
 */
class OnboardingController extends Controller
{
    public function domain(): Response
    {
        return Inertia::render('Onboarding/Domain');
    }

    public function storeDomain(StoreDomainRequest $request, AccountContext $account, DomainCreator $creator): RedirectResponse
    {
        abort_unless($account->isOwner(), 403);

        $name = $request->string('name')->toString();
        $plan = Plan::query()->where('code', $request->string('plan'))->where('active', true)->firstOrFail();

        // Going back and submitting the same name again continues the unfinished setup instead of failing.
        $unfinished = $account->domains()->first(fn (Domain $domain) => $domain->name === $name && $domain->state === 'pending' && $domain->subscription?->status === 'incomplete');
        $domain = $unfinished ?? $creator->create($account->owner(), $request->user(), $name, $plan, $account->domains());

        return redirect()->route('onboarding.plan', ['domain' => $domain->id]);
    }

    public function plan(Request $request, AccountContext $account): Response
    {
        $domain = $this->step($request, $account);

        return Inertia::render('Onboarding/Plan', ['onboarding' => $this->carried($domain)]);
    }

    public function updatePlan(Request $request, AccountContext $account): RedirectResponse
    {
        $domain = $this->step($request, $account);
        $request->validate(['plan' => ['required', 'string', 'exists:plans,code']]);
        $plan = Plan::query()->where('code', $request->string('plan'))->where('active', true)->firstOrFail();

        if ($domain->subscription !== null && $domain->subscription->status === 'incomplete') {
            $price = $plan->price('NGN', 'annual');
            $domain->subscription->forceFill(['plan_id' => $plan->id, 'price_net' => $price, 'vat' => (int) round($price * 0.075)])->save();
        }

        return redirect()->route('onboarding.records', ['domain' => $domain->id]);
    }

    public function records(Request $request, AccountContext $account): Response
    {
        $domain = $this->step($request, $account);
        $order = ['MX', 'SPF', 'DKIM', 'DMARC'];

        return Inertia::render('Onboarding/Records', [
            'onboarding' => $this->carried($domain),
            'records' => DomainRecordResource::collection($domain->records->sortBy(fn ($record) => array_search($record->type, $order))->values())->resolve(),
            'checkedAt' => $domain->records->max('last_checked_at')?->toIso8601String(),
        ]);
    }

    public function assisted(Request $request, AccountContext $account): Response
    {
        return Inertia::render('Onboarding/Assisted', ['onboarding' => $this->carried($this->step($request, $account))]);
    }

    public function mailboxes(Request $request, AccountContext $account): Response
    {
        $domain = $this->step($request, $account);

        return Inertia::render('Onboarding/Mailboxes', [
            'onboarding' => $this->carried($domain),
            'existing' => $domain->mailboxes->map(fn ($mailbox) => ['local' => $mailbox->local_part, 'quotaGb' => (float) $mailbox->quota_gb])->values(),
        ]);
    }

    public function storeMailboxes(StoreOnboardingMailboxesRequest $request, AccountContext $account, MailboxCreator $creator): RedirectResponse
    {
        $domain = $account->domain($request->string('domain')->toString());

        $rows = collect($request->validated('rows'))->map(fn (array $row) => [
            'local_part' => $row['local_part'], 'quota_gb' => $row['quota_gb'], 'password_mode' => 'link',
        ])->all();
        $creator->create($domain, $account->owner(), $request->user(), $rows);

        return redirect()->route('onboarding.done', ['domain' => $domain->id]);
    }

    public function done(Request $request, AccountContext $account): Response
    {
        $domain = $this->step($request, $account);

        return Inertia::render('Onboarding/Done', [
            'onboarding' => $this->carried($domain),
            'recordsPassing' => $domain->records->where('status', 'passing')->count(),
            'recordsTotal' => $domain->records->count(),
            'live' => $domain->state === 'live',
            'mailboxes' => $domain->mailboxes->map(fn ($mailbox) => ['id' => $mailbox->id, 'local' => $mailbox->local_part, 'quotaGb' => (float) $mailbox->quota_gb])->values(),
        ]);
    }

    /** The domain this step is about: the account's own, or a 404 that looks like any other missing page. */
    private function step(Request $request, AccountContext $account): Domain
    {
        abort_unless($account->isOwner(), 403);
        $id = $request->string('domain')->toString();
        abort_if($id === '', 404);

        return $account->domain($id);
    }

    /**
     * @return array{domain: array{id: string, name: string}, plan: array{code: ?string, name: ?string, poolGb: int, ceilingGb: ?int}}
     */
    private function carried(Domain $domain): array
    {
        $plan = $domain->subscription?->plan;

        return [
            'domain' => ['id' => $domain->id, 'name' => $domain->name],
            'plan' => ['code' => $plan?->code, 'name' => $plan?->name, 'poolGb' => $domain->poolGb(), 'ceilingGb' => $plan?->ceiling_gb],
        ];
    }
}
