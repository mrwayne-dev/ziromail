<?php

namespace App\Services\Abuse;

use App\Events\AccountChanged;
use App\Events\OpsChanged;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\AbuseFlag;
use App\Models\Mailbox;
use App\Models\Staff;
use App\Notifications\SendingRestrictedNotification;
use App\Services\MailServer\MailServer;

/**
 * The only place a mailbox's sending state changes. Every change is written to the audit trail
 * (the owner sees it in their own log), sent to the mail server, and, for a lock or a warning,
 * emailed to the owner with the reason. Nothing here touches receiving or deletes mail.
 */
class AbuseEnforcer
{
    public function __construct(private MailServer $server, private AuditLogger $audit) {}

    /** @param Staff|null $by null means the bot acted on its own */
    public function limit(Mailbox $mailbox, ?Staff $by, string $reason): void
    {
        $this->setState($mailbox, 'limited', AuditAction::SendingLimited, 'Sending on *%s* was slowed', $by, $reason);
    }

    public function lock(Mailbox $mailbox, ?Staff $by, string $reason): void
    {
        $this->setState($mailbox, 'locked', AuditAction::SendingLocked, 'Sending on *%s* was locked', $by, $reason);
        $this->tellOwner($mailbox, 'locked', $reason);
    }

    public function unlock(Mailbox $mailbox, Staff $by, string $reason): void
    {
        $this->setState($mailbox, $mailbox->restingSendingState(), AuditAction::SendingUnlocked, 'Sending on *%s* was restored', $by, $reason);
    }

    public function warn(Mailbox $mailbox, Staff $by, string $reason): void
    {
        $this->audit->account(AuditAction::OwnerWarned, $mailbox->domain->user, 'security', sprintf('We emailed you about sending on *%s*', $mailbox->address), $by, $reason, $mailbox);
        $this->tellOwner($mailbox, 'warned', $reason);
    }

    /** Close a flag with the outcome staff chose. */
    public function resolve(AbuseFlag $flag, string $outcome, Staff $by, string $reason): void
    {
        $mailbox = $flag->mailbox;

        match ($outcome) {
            'locked' => $this->lock($mailbox, $by, $reason),
            'warned' => $this->warn($mailbox, $by, $reason),
            default => $this->clear($mailbox, $by, $reason),
        };

        $flag->forceFill(['status' => 'resolved', 'outcome' => $outcome, 'resolved_by' => $by->id, 'resolution_reason' => $reason, 'resolved_at' => now()])->save();
    }

    private function clear(Mailbox $mailbox, Staff $by, string $reason): void
    {
        // A bot slow-down is lifted with the flag; a lock needs the deliberate unlock above.
        if ($mailbox->sending_state === 'limited') {
            $this->setState($mailbox, $mailbox->restingSendingState(), AuditAction::SendingUnlocked, 'Sending on *%s* was restored', $by, $reason);
        }
        $this->audit->account(AuditAction::AbuseFlagCleared, $mailbox->domain->user, 'security', sprintf('A review of sending on *%s* found nothing wrong', $mailbox->address), $by, $reason, $mailbox);
    }

    private function setState(Mailbox $mailbox, string $state, AuditAction $action, string $summary, ?Staff $by, string $reason): void
    {
        AccountChanged::for($mailbox->domain->user, 'mailbox');
        OpsChanged::fire('abuse');
        $mailbox->forceFill(['sending_state' => $state])->save();
        $this->server->setSending($mailbox, $state);
        $this->audit->account($action, $mailbox->domain->user, 'security', sprintf($summary, $mailbox->address), $by, $reason, $mailbox);
    }

    private function tellOwner(Mailbox $mailbox, string $kind, string $reason): void
    {
        $mailbox->domain->user->notify(new SendingRestrictedNotification($mailbox->address, $kind, $reason));
    }
}
