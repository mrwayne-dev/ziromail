<?php

namespace App\Services\Dashboard;

use App\Events\AccountChanged;
use App\Events\OpsChanged;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use App\Services\MailServer\MailServer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates mailboxes against a domain's storage pool. The pool arithmetic is checked here, under a
 * lock on the domain row, so two requests cannot both take the last free gigabytes.
 */
class MailboxCreator
{
    public function __construct(private MailServer $server, private AuditLogger $audit) {}

    /**
     * @param  list<array{local_part: string, display_name?: ?string, quota_gb: float, password_mode: string, first_password?: ?string}>  $rows
     * @return list<Mailbox>
     *
     * @throws ValidationException keyed `local_part` or `quota_gb` for a single row, or `rows` for a batch
     */
    public function create(Domain $domain, User $owner, User $actor, array $rows): array
    {
        $created = DB::transaction(function () use ($domain, $rows) {
            Domain::query()->whereKey($domain->id)->lockForUpdate()->first();

            $assigned = (float) Mailbox::query()->where('domain_id', $domain->id)->sum('quota_gb');
            $free = round($domain->poolGb() - $assigned, 1);
            $single = count($rows) === 1;
            $seen = [];
            $made = [];

            foreach ($rows as $row) {
                $local = mb_strtolower($row['local_part']);
                $quota = round((float) $row['quota_gb'], 1);
                $localKey = $single ? 'local_part' : 'rows';
                $quotaKey = $single ? 'quota_gb' : 'rows';

                if (isset($seen[$local]) || Mailbox::query()->where('domain_id', $domain->id)->where('local_part', $local)->exists()) {
                    throw ValidationException::withMessages([$localKey => 'A mailbox with this address already exists on this domain.']);
                }
                $seen[$local] = true;

                if ($quota > $free) {
                    throw ValidationException::withMessages([$quotaKey => 'Only '.max($free, 0).' GB is unassigned in the pool. Choose a smaller quota or add storage.']);
                }
                $free = round($free - $quota, 1);

                $mailbox = new Mailbox([
                    'local_part' => $local,
                    'display_name' => $row['display_name'] ?? null,
                    'role_label' => 'Staff',
                    'quota_gb' => $quota,
                    'state' => 'not_set_up',
                    'require_password_change' => ($row['password_mode'] ?? 'link') === 'set',
                ]);
                $mailbox->domain_id = $domain->id;
                $mailbox->save();
                $made[] = [$mailbox, $row['first_password'] ?? null];
            }

            return $made;
        });

        $mailboxes = [];
        foreach ($created as [$mailbox, $password]) {
            // The first password goes to the mail server and nowhere else: it is not stored or logged.
            $confirmed = $this->server->create($mailbox->setRelation('domain', $domain), $password);
            $resting = $mailbox->restingSendingState();
            if ($resting !== 'normal') {
                $mailbox->forceFill(['sending_state' => $resting])->save();
                $this->server->setSending($mailbox, $resting);
            }
            $mailbox->forceFill(['provisioning_state' => $confirmed ? 'done' : 'pending'])->save();
            AccountChanged::for($owner, 'mailbox');
            OpsChanged::fire('mailboxes');
            $this->audit->account(AuditAction::MailboxCreated, $owner, 'mailboxes', 'You created *'.$mailbox->local_part.'@'.$domain->name.'*', $actor, subject: $mailbox);
            $mailboxes[] = $mailbox;
        }

        return $mailboxes;
    }
}
