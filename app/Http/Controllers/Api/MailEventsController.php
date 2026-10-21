<?php

namespace App\Http\Controllers\Api;

use App\Events\OpsChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MailEventsRequest;
use App\Models\DeliveryStat;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\SendingStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Where the mail server reports hourly counts. A row replaces any earlier row for the same hour,
 * so the server can resend safely. Rows for mailboxes or domains we do not know are skipped and
 * counted, never created. Hours older than a week or in the future are refused.
 */
class MailEventsController extends Controller
{
    public function __invoke(MailEventsRequest $request): JsonResponse
    {
        $accepted = 0;
        $skipped = 0;

        foreach ($request->validated('sending', []) as $row) {
            $hour = $this->hour($row['hour']);
            $mailbox = $hour === null ? null : $this->mailbox($row['mailbox']);
            if ($mailbox === null) {
                $skipped++;

                continue;
            }
            $stat = SendingStat::query()->firstOrNew(['mailbox_id' => $mailbox->id, 'hour' => $hour]);
            $stat->mailbox_id = $mailbox->id;
            $stat->fill([
                'sent' => $row['sent'], 'bounced' => $row['bounced'], 'complaints' => $row['complaints'],
                'new_recipients' => $row['new_recipients'] ?? 0, 'filter_flagged' => $row['filter_flagged'] ?? 0,
            ])->save();
            $accepted++;
        }

        foreach ($request->validated('delivery', []) as $row) {
            $hour = $this->hour($row['hour']);
            $domain = $hour === null ? null : Domain::query()->where('name', mb_strtolower($row['domain']))->first();
            if ($domain === null) {
                $skipped++;

                continue;
            }
            $stat = DeliveryStat::query()->firstOrNew(['domain_id' => $domain->id, 'recipient_domain' => mb_strtolower($row['recipient_domain']), 'hour' => $hour]);
            $stat->domain_id = $domain->id;
            $stat->fill(['delivered' => $row['delivered'], 'deferred' => $row['deferred'], 'bounced' => $row['bounced'], 'rejected' => $row['rejected'], 'reply_code' => $row['reply_code'] ?? null])->save();
            $accepted++;
        }

        if ($accepted > 0) {
            OpsChanged::fire('mail-events');
        }

        return response()->json(['success' => true, 'accepted' => $accepted, 'skipped' => $skipped]);
    }

    /** A whole hour within the last week and not in the future, or null. */
    private function hour(string $value): ?Carbon
    {
        $hour = Carbon::parse($value)->utc()->startOfHour();

        return $hour->lte(now()->addMinutes(5)) && $hour->gte(now()->subDays(7)) ? $hour : null;
    }

    private function mailbox(string $address): ?Mailbox
    {
        [$local, $domain] = array_pad(explode('@', mb_strtolower($address), 2), 2, '');

        return Mailbox::query()->where('local_part', $local)->whereHas('domain', fn ($query) => $query->where('name', $domain))->first();
    }
}
