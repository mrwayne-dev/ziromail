<?php

namespace App\Services\Abuse;

use App\Events\AccountChanged;
use App\Events\OpsChanged;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\AbuseFlag;
use App\Models\Mailbox;
use App\Models\SendingStat;
use Carbon\CarbonInterface;

/**
 * Reads how much a mailbox sent in an hour and decides whether it looks unlike itself. It sees
 * counts only. A trip slows the mailbox; a clear-cut combination locks sending; everything else
 * waits in the abuse queue for a person. Receiving is never touched.
 */
class AbuseEvaluator
{
    public function __construct(private AbuseEnforcer $enforcer, private AuditLogger $audit) {}

    public function evaluate(Mailbox $mailbox, CarbonInterface $hour): ?AbuseFlag
    {
        if ($mailbox->abuse_exempt_reason !== null) {
            return null;
        }

        $hour = $hour->copy()->startOfHour();
        $stat = SendingStat::query()->where('mailbox_id', $mailbox->id)->where('hour', $hour)->first();
        if ($stat === null || $stat->sent === 0) {
            return null;
        }

        $baseline = $this->baselinePerHour($mailbox, $hour);
        $bouncePct = round($stat->bounced / $stat->sent * 100, 1);
        $complaintPct = round($stat->complaints / $stat->sent * 100, 2);
        $filterPct = round($stat->filter_flagged / $stat->sent * 100, 1);
        $judged = $stat->sent >= config('abuse.min_sample');

        $rules = array_keys(array_filter([
            'volume' => $stat->sent >= max(config('abuse.min_volume'), config('abuse.volume_multiple') * $baseline),
            'bounce' => $judged && $bouncePct > config('abuse.bounce_hour_pct'),
            'complaint' => $judged && $complaintPct > config('abuse.complaint_pct'),
            'filter' => $judged && $filterPct > config('abuse.filter_pct'),
        ]));

        if ($rules === []) {
            return null;
        }

        $clearCut = in_array('volume', $rules, true) && count(array_intersect($rules, ['bounce', 'complaint', 'filter'])) > 0;
        $severity = $clearCut ? 'high' : (count($rules) > 1 || in_array('complaint', $rules, true) ? 'medium' : 'low');
        $evidence = [
            'hour' => $hour->toIso8601String(), 'sent' => $stat->sent, 'bounced' => $stat->bounced, 'bouncePct' => $bouncePct,
            'complaints' => $stat->complaints, 'complaintPct' => $complaintPct, 'newRecipients' => $stat->new_recipients, 'filterFlagged' => $stat->filter_flagged, 'filterPct' => $filterPct,
            'baselinePerHour' => round($baseline, 1),
        ];

        $flag = AbuseFlag::query()->where('mailbox_id', $mailbox->id)->where('status', 'open')->first();
        if ($flag === null) {
            $flag = new AbuseFlag(['severity' => $severity, 'rules' => $rules, 'evidence' => $evidence]);
            $flag->mailbox_id = $mailbox->id;
            $flag->save();
            $flag->refresh();
            AccountChanged::for($mailbox->domain->user, 'security');
            OpsChanged::fire('abuse');
            $this->audit->account(AuditAction::AbuseFlagRaised, $mailbox->domain->user, 'security', 'Sending on *'.$mailbox->address.'* was flagged for review', null, 'Unusual sending: '.implode(', ', $rules), $mailbox);
        } else {
            $flag->forceFill([
                'severity' => collect(['low', 'medium', 'high'])->search($severity) > collect(['low', 'medium', 'high'])->search($flag->severity) ? $severity : $flag->severity,
                'rules' => array_values(array_unique([...$flag->rules, ...$rules])),
                'evidence' => $evidence,
            ])->save();
        }

        $state = Mailbox::query()->whereKey($mailbox->id)->value('sending_state');
        $reason = 'Automatic: '.implode(' and ', $rules).' above this mailbox\'s normal pattern';
        $wouldLock = $clearCut && config('abuse.auto_lock') && $state !== 'locked';
        $wouldLimit = ! $wouldLock && config('abuse.auto_limit') && in_array($state, ['normal', 'probation'], true);

        if (config('abuse.mode') !== 'live') {
            // Dry run: say what would have happened, change nothing, tell nobody.
            if ($wouldLock || $wouldLimit) {
                $flag->forceFill(['auto_action' => $wouldLock ? 'would_lock' : 'would_limit'])->save();
            }

            return $flag;
        }

        if ($wouldLock) {
            $this->enforcer->lock($mailbox, null, $reason);
            $flag->forceFill(['auto_action' => 'locked'])->save();
        } elseif ($wouldLimit) {
            $this->enforcer->limit($mailbox, null, $reason);
            $flag->forceFill(['auto_action' => 'limited'])->save();
        }

        return $flag;
    }

    /** The mailbox's own average messages per hour over the baseline window, before this hour. */
    private function baselinePerHour(Mailbox $mailbox, CarbonInterface $hour): float
    {
        $days = (int) config('abuse.baseline_days');
        $sent = (int) SendingStat::query()->where('mailbox_id', $mailbox->id)
            ->where('hour', '<', $hour)->where('hour', '>=', $hour->copy()->subDays($days))->sum('sent');

        return $sent / ($days * 24);
    }
}
