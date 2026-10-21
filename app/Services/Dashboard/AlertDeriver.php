<?php

namespace App\Services\Dashboard;

use App\Models\Domain;
use Illuminate\Support\Collection;

/**
 * The attention stack on the overview. It is derived from the account's own rows, never
 * authored: a record that stopped passing, a mailbox nearly full, a payment behind, a lock.
 * Each alert names a route; the page turns it into a link.
 */
class AlertDeriver
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function for(Domain $domain): Collection
    {
        $alerts = collect();
        $subscription = $domain->subscription;

        if ($subscription?->status === 'past_due') {
            $alerts->push([
                'id' => 'past-due', 'kind' => 'bad',
                'title' => 'Your last payment did not go through',
                'body' => 'Mail keeps working while we retry. Pay before the grace period ends to avoid a pause on sending.',
                'cta' => ['label' => 'Go to billing', 'routeName' => 'dashboard.billing'],
            ]);
        }

        $failing = $domain->records->where('status', '!=', 'passing')->first();
        if ($failing !== null) {
            $missing = $failing->status === 'missing';
            $alerts->push([
                'id' => 'records', 'kind' => 'bad',
                'title' => $missing ? $failing->type.' has never been added for this domain' : $domain->name.' has a record that needs fixing',
                'body' => $missing
                    ? 'Without it your messages can be treated as suspicious, and Gmail and Outlook may place some of them in spam.'
                    : 'One of your DNS records stopped matching. Mail may start landing in spam until it is fixed.',
                'cta' => ['label' => 'Open the domain', 'routeName' => 'dashboard.domains.show', 'params' => ['domain' => $domain->id]],
            ]);
        }

        foreach ($domain->mailboxes as $mailbox) {
            $address = $mailbox->local_part.'@'.$domain->name;

            if ($mailbox->state === 'locked') {
                $alerts->push([
                    'id' => 'locked-'.$mailbox->id, 'kind' => 'bad',
                    'title' => 'Sending is paused for '.$address,
                    'body' => 'We saw unusual sending and stopped it to protect your reputation. Receiving continues. Contact support to review and lift the pause.',
                    'cta' => ['label' => 'Contact support', 'routeName' => 'dashboard.help'],
                ]);
            } elseif ($mailbox->state === 'active' && $mailbox->quota_gb > 0 && $mailbox->used_gb / $mailbox->quota_gb >= 0.75) {
                $alerts->push([
                    'id' => 'quota-'.$mailbox->id, 'kind' => 'warn',
                    'title' => $address.' is nearly full',
                    'body' => 'It is using '.$mailbox->used_gb.' GB of '.$mailbox->quota_gb.' GB. At 100% it stops receiving mail; queued mail is held, not discarded.',
                    'cta' => ['label' => 'Raise the quota', 'routeName' => 'dashboard.mailboxes.show', 'params' => ['mailbox' => $mailbox->id]],
                ]);
            }
        }

        return $alerts->values();
    }
}
