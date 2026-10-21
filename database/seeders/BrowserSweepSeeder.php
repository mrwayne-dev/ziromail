<?php

namespace Database\Seeders;

use App\Models\AbuseFlag;
use App\Models\DeliveryStat;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\SendingStat;
use App\Models\Staff;
use App\Models\User;
use App\Services\Dns\ExpectedRecords;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/** Fixed data for the browser and axe sweep. Not used in production. */
class BrowserSweepSeeder extends Seeder
{
    public function run(ExpectedRecords $expected): void
    {
        $this->call(PlanSeeder::class);

        $owner = User::query()->create([
            'name' => 'Adaobi Chukwu', 'email' => 'owner@sweep.test',
            'password' => Hash::make('BrowserSweep123!'),
            'email_verified_at' => now(), 'business_name' => 'Adaobi Foods Ltd',
        ]);

        $domain = new Domain(['name' => 'sweepfoods.com']);
        $domain->user_id = $owner->id;
        $domain->save();
        foreach ($expected->for('sweepfoods.com') as $type => $values) {
            $domain->records()->forceCreate(['type' => $type, 'status' => $type === 'MX' ? 'passing' : 'waiting', 'expected' => $values, 'last_checked_at' => now()->subMinutes(2)]);
        }
        $domain->subscription()->forceCreate(['plan_id' => 2, 'term' => 'annual', 'status' => 'incomplete', 'currency' => 'NGN', 'price_net' => 2760000, 'vat' => 207000]);

        foreach (['sales' => 10, 'orders' => 8, 'ops' => 5] as $local => $gb) {
            $mailbox = new Mailbox(['local_part' => $local, 'quota_gb' => $gb, 'display_name' => ucfirst($local)]);
            $mailbox->domain_id = $domain->id;
            $mailbox->save();
        }

        // Give the delivery pages something to render.
        $hour = now()->startOfHour();
        $stat = new DeliveryStat(['recipient_domain' => 'gmail.com', 'hour' => $hour, 'delivered' => 86, 'deferred' => 3, 'bounced' => 1, 'rejected' => 0, 'reply_code' => null]);
        $stat->domain_id = $domain->id;
        $stat->save();
        $stat = new DeliveryStat(['recipient_domain' => 'yahoo.com', 'hour' => $hour, 'delivered' => 20, 'deferred' => 0, 'bounced' => 2, 'rejected' => 0, 'reply_code' => '550 5.1.1']);
        $stat->domain_id = $domain->id;
        $stat->save();

        // Give the abuse page a flag.
        $mailbox = $domain->mailboxes()->where('local_part', 'sales')->first();
        $send = new SendingStat(['hour' => $hour, 'sent' => 120, 'bounced' => 20, 'complaints' => 1, 'new_recipients' => 90, 'filter_flagged' => 10]);
        $send->mailbox_id = $mailbox->id;
        $send->save();
        $flag = new AbuseFlag(['severity' => 'medium', 'rules' => ['bounce'], 'evidence' => ['sent' => 120, 'bounced' => 20, 'bouncePct' => 16.7, 'complaints' => 1, 'complaintPct' => 0.8, 'baselinePerHour' => 1.5, 'filterFlagged' => 10, 'filterPct' => 8.3, 'newRecipients' => 90]]);
        $flag->mailbox_id = $mailbox->id;
        $flag->save();

        // Known staff creds, with 2FA pre-confirmed on a fixed secret so Playwright can compute codes.
        Staff::query()->create([
            'name' => 'Operations', 'email' => 'ops@sweep.test',
            'password' => Hash::make('BrowserSweep123!'), 'role' => 'owner',
            'two_factor_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
