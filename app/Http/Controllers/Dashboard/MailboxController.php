<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreMailboxRequest;
use App\Http\Requests\Dashboard\UpdateMailboxRequest;
use App\Http\Resources\ActivityItemResource;
use App\Http\Resources\DomainSummaryResource;
use App\Http\Resources\MailboxRowResource;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\AuditLog;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Services\AccountContext;
use App\Services\Dashboard\MailboxCreator;
use App\Services\MailServer\MailServer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MailboxController extends Controller
{
    public function index(AccountContext $account): Response|RedirectResponse
    {
        $domain = $account->current();
        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }

        return Inertia::render('Dashboard/Mailboxes', [
            'domain' => (new DomainSummaryResource($domain))->resolve(),
            'plan' => ['code' => $domain->subscription?->plan->code, 'name' => $domain->subscription?->plan->name],
            'pool' => $this->pool($domain),
            'mailboxes' => MailboxRowResource::collection($domain->mailboxes->values())->resolve(),
            'can' => ['create' => true, 'buyStorage' => $account->isOwner()],
        ]);
    }

    public function store(StoreMailboxRequest $request, AccountContext $account, MailboxCreator $creator): RedirectResponse
    {
        $domain = $account->domain($request->string('domain')->toString());
        $creator->create($domain, $account->owner(), $request->user(), [$request->safe()->only(['local_part', 'display_name', 'quota_gb', 'password_mode', 'first_password'])]);

        return redirect()->route('dashboard.mailboxes', ['domain' => $domain->id])->with('status', 'mailbox-created');
    }

    public function show(string $mailbox, AccountContext $account): Response
    {
        $mailbox = $this->owned($account, $mailbox);
        $domain = $mailbox->domain;
        $settings = $mailbox->settings ?? [];

        return Inertia::render('Dashboard/Mailbox', [
            'mailbox' => [
                ...(new MailboxRowResource($mailbox))->resolve(),
                'address' => $mailbox->address,
                'displayName' => $mailbox->display_name ?? '',
                'createdAt' => $mailbox->created_at->toIso8601String(),
                'requireTwoFactor' => $mailbox->require_two_factor,
                'requirePasswordChange' => $mailbox->require_password_change,
                'provisioning' => $mailbox->provisioning_state,
                'aliases' => $domain->aliases->filter(fn ($alias) => in_array($mailbox->local_part, $alias->destinations, true))
                    ->map(fn ($alias) => ['id' => $alias->id, 'address' => $alias->local_part.'@'.$domain->name, 'addedAt' => $alias->created_at->toIso8601String()])->values(),
                'devices' => [],
            ],
            'domain' => (new DomainSummaryResource($domain))->resolve(),
            'pool' => $this->pool($domain),
            'forwarding' => $settings['forwarding'] ?? ['to' => '', 'keepCopy' => true],
            'autoReply' => $settings['auto_reply'] ?? ['on' => false, 'from' => '', 'until' => '', 'message' => ''],
            'filtering' => $settings['filtering'] ?? ['spam' => true, 'rejectExecutables' => true],
            'limits' => ['hourly' => $settings['limits']['hourly'] ?? 100, 'daily' => $settings['limits']['daily'] ?? 500, 'planDefaults' => ['hourly' => 100, 'daily' => 500]],
            'activity' => ActivityItemResource::collection(
                AuditLog::query()->where('account_id', $account->owner()->getKey())->where('subject_type', 'Mailbox')->where('subject_id', $mailbox->id)->latest('id')->limit(5)->get()
            )->resolve(),
            'can' => ['manage' => true],
        ]);
    }

    public function update(UpdateMailboxRequest $request, string $mailbox, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        $mailbox = $this->owned($account, $mailbox);
        $domain = $mailbox->domain;
        $data = $request->validated();

        DB::transaction(function () use ($data, $mailbox, $domain, $account, $request, $audit) {
            Domain::query()->whereKey($domain->id)->lockForUpdate()->first();

            if (array_key_exists('quota_gb', $data)) {
                $this->changeQuota($mailbox, $domain, round((float) $data['quota_gb'], 1), $account, $request, $audit);
            }

            foreach (['display_name', 'require_two_factor', 'require_password_change'] as $field) {
                if (array_key_exists($field, $data)) {
                    $mailbox->{$field} = $data[$field];
                }
            }

            $settings = $mailbox->settings ?? [];
            foreach (['forwarding', 'auto_reply', 'filtering', 'limits'] as $section) {
                if (array_key_exists($section, $data)) {
                    $settings[$section] = $data[$section];
                }
            }
            $mailbox->settings = $settings;
            $mailbox->save();
        });

        return back()->with('status', 'saved');
    }

    public function suspend(string $mailbox, AccountContext $account, MailServer $server, AuditLogger $audit): RedirectResponse
    {
        $mailbox = $this->owned($account, $mailbox);
        $mailbox->forceFill(['state' => 'suspended'])->save();
        $server->suspend($mailbox);
        $audit->account(AuditAction::MailboxSuspended, $account->owner(), 'mailboxes', 'You suspended *'.$mailbox->address.'*', request()->user(), subject: $mailbox);

        return back()->with('status', 'suspended');
    }

    public function destroy(string $mailbox, AccountContext $account, MailServer $server, AuditLogger $audit): RedirectResponse
    {
        $mailbox = $this->owned($account, $mailbox);
        $address = $mailbox->address;
        $mailbox->delete();
        $server->delete($mailbox);
        $audit->account(AuditAction::MailboxDeleted, $account->owner(), 'mailboxes', 'You deleted *'.$address.'*', request()->user(), 'Held for 30 days, then removed. Its storage is back in the pool.', $mailbox);

        return redirect()->route('dashboard.mailboxes', ['domain' => $mailbox->domain_id])->with('status', 'deleted');
    }

    private function changeQuota(Mailbox $mailbox, Domain $domain, float $quota, AccountContext $account, Request $request, AuditLogger $audit): void
    {
        $others = (float) Mailbox::query()->where('domain_id', $domain->id)->whereKeyNot($mailbox->id)->sum('quota_gb');
        $max = round($domain->poolGb() - $others, 1);
        $min = round(ceil($mailbox->used_gb * 10) / 10, 1);

        if ($quota < $min) {
            throw ValidationException::withMessages(['quota_gb' => 'This mailbox already uses '.$min.' GB, so its quota cannot go lower.']);
        }
        if ($quota > $max) {
            throw ValidationException::withMessages(['quota_gb' => 'Only '.$max.' GB is available to this mailbox. Free some from another mailbox or add storage.']);
        }

        $from = $mailbox->quota_gb;
        if ($quota !== $from) {
            $mailbox->quota_gb = $quota;
            $audit->account(AuditAction::MailboxQuotaChanged, $account->owner(), 'storage', 'Quota for *'.$mailbox->local_part.'@* changed from '.$from.' GB to '.$quota.' GB', $request->user(), 'Pool unassigned is now '.round($domain->poolGb() - $others - $quota, 1).' GB', $mailbox, ['quota_from' => $from, 'quota_to' => $quota]);
        }
    }

    /** Resolves a mailbox only through this account's own domains, so another account's id is a 404. */
    private function owned(AccountContext $account, string $id): Mailbox
    {
        foreach ($account->domains() as $domain) {
            if ($mailbox = $domain->mailboxes->firstWhere('id', $id)) {
                return $mailbox->setRelation('domain', $domain);
            }
        }

        abort(404);
    }

    /**
     * @return array<string, mixed>
     */
    private function pool(Domain $domain): array
    {
        return [
            'poolGb' => $domain->poolGb(),
            'planGb' => $domain->subscription?->plan->pool_gb ?? 0,
            'boughtGb' => $domain->subscription?->extra_storage_gb ?? 0,
            'ceilingGb' => $domain->subscription?->plan->ceiling_gb,
            'assignedGb' => $domain->assignedGb(),
            'usedGb' => $domain->usedGb(),
            'unassignedGb' => $domain->unassignedGb(),
        ];
    }
}
