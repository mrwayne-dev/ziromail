<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityItemResource;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\AbuseFlag;
use App\Models\AuditLog;
use App\Models\Mailbox;
use App\Models\SendingStat;
use App\Models\Staff;
use App\Services\Abuse\AbuseEnforcer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The abuse queue. Staff see counts and rates for a mailbox and decide; they never see what was
 * sent, because the platform does not keep it. Locking is limited to engineers and owners.
 */
class AbuseController extends Controller
{
    private const SEVERITY_LABEL = ['high' => 'Sending locked automatically', 'medium' => 'Needs a decision', 'low' => 'Worth a look'];

    public function index(): Response
    {
        $flags = AbuseFlag::query()->with('mailbox.domain.user')->where('status', 'open')
            ->orderByRaw("FIELD(severity, 'high', 'medium', 'low')")->latest('updated_at')->get();

        $resolved = AbuseFlag::query()->with(['mailbox.domain', 'resolver'])->where('status', 'resolved')
            ->where('resolved_at', '>=', now()->subDays(7))->latest('resolved_at')->limit(50)->get();

        return Inertia::render('Ops/Abuse', [
            'flags' => $flags->map(fn (AbuseFlag $flag) => $this->row($flag))->values(),
            'resolved' => $resolved->map(fn (AbuseFlag $flag) => [
                'id' => $flag->id, 'address' => $flag->mailbox->address, 'flaggedFor' => $this->summary($flag),
                'outcome' => $flag->outcome, 'by' => $flag->resolver?->name ?? 'Staff', 'at' => $flag->resolved_at->toIso8601String(),
                'reason' => $flag->resolution_reason,
            ])->values(),
            'restricted' => Mailbox::query()->with('domain.user')->whereIn('sending_state', ['limited', 'locked'])->orderBy('updated_at')->get()
                ->map(fn (Mailbox $mailbox) => ['id' => $mailbox->id, 'address' => $mailbox->address, 'state' => $mailbox->sending_state, 'owner' => $mailbox->domain->user->business_name ?? $mailbox->domain->user->name])->values(),
            'rules' => $this->rules(),
            'mode' => config('abuse.mode'),
        ]);
    }

    public function show(AbuseFlag $flag): Response
    {
        $flag->load('mailbox.domain.user');
        $mailbox = $flag->mailbox;
        $end = now()->startOfHour();
        $start = $end->copy()->subHours(23);

        $byHour = SendingStat::query()->where('mailbox_id', $mailbox->id)->whereBetween('hour', [$start, $end])->get()->keyBy(fn ($stat) => $stat->hour->toIso8601String());
        $series = collect(range(0, 23))->map(fn (int $i) => $byHour->get($start->copy()->addHours($i)->toIso8601String())?->sent ?? 0)->all();

        return Inertia::render('Ops/AbuseDetail', [
            'flag' => $this->row($flag),
            'detail' => [
                'series' => $series,
                'startsAt' => $start->toIso8601String(),
                'baselinePerHour' => $flag->evidence['baselinePerHour'] ?? 0,
                'mailboxCount' => $mailbox->domain->mailboxes()->count(),
                'plan' => $mailbox->domain->subscription?->plan?->name,
                'history' => ActivityItemResource::collection(
                    AuditLog::query()->where('account_id', $mailbox->domain->user_id)->where('subject_type', 'Mailbox')->where('subject_id', $mailbox->id)->latest('id')->limit(10)->get()
                )->resolve(),
            ],
            'rules' => $this->rules(),
            'mode' => config('abuse.mode'),
            'exemptReason' => $mailbox->abuse_exempt_reason,
        ]);
    }

    public function resolve(Request $request, AbuseFlag $flag, AbuseEnforcer $enforcer): RedirectResponse
    {
        $data = $request->validate([
            'outcome' => ['required', 'in:locked,warned,cleared'],
            'reason' => ['required', 'string', 'min:5', 'max:255'],
        ]);
        $staff = $this->staff($request);

        abort_if($flag->status !== 'open', 409);
        abort_if($data['outcome'] === 'locked' && ! $this->canLock($staff), 403);

        $flag->load('mailbox.domain.user');
        $enforcer->resolve($flag, $data['outcome'], $staff, $data['reason']);

        return redirect()->route('ops.abuse')->with('status', 'abuse-'.$data['outcome']);
    }

    public function unlock(Request $request, Mailbox $mailbox, AbuseEnforcer $enforcer): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:255']]);
        $staff = $this->staff($request);

        abort_unless($this->canLock($staff), 403);
        abort_unless(in_array($mailbox->sending_state, ['limited', 'locked'], true), 409);

        $mailbox->load('domain.user');
        $enforcer->unlock($mailbox, $staff, $data['reason']);

        return redirect()->route('ops.abuse')->with('status', 'abuse-unlocked');
    }

    public function exempt(Request $request, Mailbox $mailbox, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'min:5', 'max:255']]);
        $staff = $this->staff($request);
        abort_unless($staff->role === 'owner', 403);

        $mailbox->load('domain.user');
        $reason = $data['reason'] ?? null;
        $mailbox->forceFill(['abuse_exempt_reason' => $reason])->save();
        $audit->account(AuditAction::AbuseExemptionChanged, $mailbox->domain->user, 'security', $reason === null ? sprintf('Sending checks on *%s* were switched back on', $mailbox->address) : sprintf('Sending checks on *%s* were switched off', $mailbox->address), $staff, $reason ?? 'Exemption removed', $mailbox);

        return back()->with('status', 'abuse-exemption');
    }

    private function staff(Request $request): Staff
    {
        /** @var Staff */
        return $request->user('staff');
    }

    private function canLock(Staff $staff): bool
    {
        return in_array($staff->role, ['engineer', 'owner'], true);
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'volumeMultiple' => config('abuse.volume_multiple'), 'minVolume' => config('abuse.min_volume'),
            'bounceHourPct' => config('abuse.bounce_hour_pct'), 'complaintPct' => config('abuse.complaint_pct'),
            'filterPct' => config('abuse.filter_pct'), 'minSample' => config('abuse.min_sample'), 'limitedPerHour' => config('abuse.limited_per_hour'),
        ];
    }

    private function summary(AbuseFlag $flag): string
    {
        $evidence = $flag->evidence;

        return number_format($evidence['sent'] ?? 0).' messages in an hour, '.implode(' and ', $flag->rules).' above normal';
    }

    /** @return array<string, mixed> */
    private function row(AbuseFlag $flag): array
    {
        $mailbox = $flag->mailbox;
        $owner = $mailbox->domain->user;
        $e = $flag->evidence;

        return [
            'id' => $flag->id,
            'mailboxId' => $mailbox->id,
            'address' => $mailbox->address,
            'orgName' => $owner->business_name ?? $owner->name,
            'ownerId' => $owner->id,
            'planName' => $mailbox->domain->subscription?->plan?->name,
            'customerSince' => $owner->created_at->toIso8601String(),
            'severity' => $flag->severity,
            'stateLabel' => self::SEVERITY_LABEL[$flag->severity],
            'sendingState' => $mailbox->sending_state,
            'autoAction' => $flag->auto_action,
            'rules' => $flag->rules,
            'evidence' => [
                ['key' => 'sent', 'k' => 'Sent this hour', 'v' => number_format($e['sent'] ?? 0), 'hot' => in_array('volume', $flag->rules, true), 'n' => 'its own hourly average is '.($e['baselinePerHour'] ?? 0)],
                ['key' => 'bounce', 'k' => 'Bounced', 'v' => ($e['bouncePct'] ?? 0).'%', 'hot' => in_array('bounce', $flag->rules, true), 'n' => number_format($e['bounced'] ?? 0).' messages'],
                ['key' => 'complaints', 'k' => 'Reported as spam', 'v' => ($e['complaintPct'] ?? 0).'%', 'hot' => in_array('complaint', $flag->rules, true), 'n' => number_format($e['complaints'] ?? 0).' reports'],
                ['key' => 'filter', 'k' => 'Flagged by the outbound filter', 'v' => ($e['filterPct'] ?? 0).'%', 'hot' => in_array('filter', $flag->rules, true), 'n' => number_format($e['filterFlagged'] ?? 0).' messages, counted not read'],
                ['key' => 'new', 'k' => 'New recipients', 'v' => number_format($e['newRecipients'] ?? 0), 'hot' => false, 'n' => 'never mailed by this address before'],
            ],
            'verdict' => $flag->auto_action === 'locked'
                ? 'Volume, and bounces or complaints, were all far outside this mailbox\'s normal pattern, so sending was locked automatically. Check, then unlock if it is a mistake.'
                : 'The numbers are unusual for this mailbox. Sending was slowed automatically. The bot cannot tell a marketing blast from a compromise, so a person decides.',
            'summary' => $this->summary($flag),
        ];
    }
}
