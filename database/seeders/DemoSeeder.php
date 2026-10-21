<?php

namespace Database\Seeders;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Alias;
use App\Models\Delegation;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Mailbox;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * The Adaobi Foods demo, in the database. Local and testing only: it refuses to run in
 * production so demonstration data can never reach real customers.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('The demo seeder is for local and test environments only.');
        }

        $this->call(PlanSeeder::class);

        $owner = User::query()->firstOrNew(['email' => 'owner@adaobifoods.test']);
        $owner->forceFill([
            'name' => 'Victory Adaobi',
            'business_name' => 'Adaobi Foods Ltd',
            'phone' => '08030000000',
            'password' => Hash::make(env('DEMO_OWNER_PASSWORD', 'a-long-enough-passphrase')),
            'email_verified_at' => now(),
            'terms_accepted_at' => now(),
            'terms_version' => '2026-09',
        ])->save();

        $foods = $this->domain($owner, 'adaobifoods.com', 'business', 10, '2027-03-04', 'Whogohost', [
            'MX' => 'passing', 'SPF' => 'passing', 'DKIM' => 'passing', 'DMARC' => 'passing',
        ]);
        $export = $this->domain($owner, 'adaobiexport.ng', 'starter', 0, '2027-08-18', 'Qservers', [
            'MX' => 'passing', 'SPF' => 'passing', 'DKIM' => 'missing', 'DMARC' => 'passing',
        ]);

        foreach ([
            [$foods, 'victory', 'Owner', 12, 4.2, 'active'], [$foods, 'sales', 'Shared', 8, 6.1, 'active'],
            [$foods, 'ngozi', 'Staff', 4, 1.8, 'active'], [$foods, 'emeka', 'Staff', 2, 1.4, 'not_set_up'],
            [$export, 'victory', 'Owner', 2.5, 0.9, 'active'], [$export, 'export', 'Shared', 1.5, 0.3, 'active'],
        ] as [$domain, $local, $role, $quota, $used, $state]) {
            $mailbox = new Mailbox(['local_part' => $local, 'role_label' => $role, 'quota_gb' => $quota, 'state' => $state]);
            $mailbox->domain_id = $domain->id;
            $mailbox->forceFill(['used_gb' => $used, 'provisioning_state' => 'done', 'last_login_at' => $state === 'active' ? now()->subHours(3) : null, 'setup_completed_at' => $state === 'active' ? now()->subMonths(6) : null])->save();
        }

        foreach ([['info', ['victory', 'sales']], ['accounts', ['victory']], ['orders', ['sales']]] as [$local, $to]) {
            $alias = new Alias(['local_part' => $local, 'destinations' => $to]);
            $alias->domain_id = $foods->id;
            $alias->save();
        }

        $team = new TeamMember(['email' => 'ngozi@adaobifoods.com', 'role' => 'admin']);
        $team->forceFill(['owner_id' => $owner->id, 'accepted_at' => now()->subMonths(6)])->save();
        $delegation = new Delegation(['grantee_name' => 'Techsavii Ltd', 'scope' => 'Agency access to adaobifoods.com']);
        $delegation->forceFill(['owner_id' => $owner->id])->save();

        Invoice::query()->forceCreate(['user_id' => $owner->id, 'domain_id' => $foods->id, 'number' => 'ZIRO-2026-0001', 'issued_at' => '2026-03-04', 'description' => 'Business plan, 1 year', 'currency' => 'NGN', 'net' => 2760000, 'vat' => 207000, 'total' => 2967000, 'status' => 'paid']);
        Invoice::query()->forceCreate(['user_id' => $owner->id, 'domain_id' => $foods->id, 'number' => 'ZIRO-2026-0002', 'issued_at' => '2026-09-15', 'description' => 'Extra storage, 10 GB', 'currency' => 'NGN', 'net' => 600000, 'vat' => 45000, 'total' => 645000, 'status' => 'paid']);

        $audit = app(AuditLogger::class);
        $audit->account(AuditAction::DomainVerified, $owner, 'domain', '*adaobifoods.com* finished setup, all records passing', subject: $foods);
        $audit->account(AuditAction::MailboxQuotaChanged, $owner, 'storage', 'Quota for *sales@* raised from 6 GB to 8 GB', $owner, 'Pool unassigned went from 16 GB to 14 GB');
        $audit->account(AuditAction::MailboxCreated, $owner, 'mailboxes', 'You created *emeka@adaobifoods.com*', $owner);
    }

    /**
     * @param  array<string, string>  $records
     */
    private function domain(User $owner, string $name, string $planCode, int $extraGb, string $renews, string $registrar, array $records): Domain
    {
        $plan = Plan::query()->where('code', $planCode)->firstOrFail();
        $domain = new Domain(['name' => $name, 'registrar' => $registrar]);
        $domain->user_id = $owner->id;
        $domain->save();
        $domain->goLive();

        $price = $plan->price('NGN', 'annual');
        Subscription::query()->forceCreate([
            'domain_id' => $domain->id, 'plan_id' => $plan->id, 'term' => 'annual', 'status' => 'active', 'renews_at' => $renews,
            'paid_by' => 'transfer', 'extra_storage_gb' => $extraGb, 'currency' => 'NGN', 'price_net' => $price, 'vat' => (int) round($price * 0.075),
        ]);

        $values = ['MX' => ['host' => '@', 'value' => 'mx.ziroemail.com', 'priority' => 10], 'SPF' => ['host' => '@', 'value' => 'v=spf1 include:_spf.ziroemail.com ~all'], 'DKIM' => ['host' => 'ziro._domainkey', 'value' => 'v=DKIM1; k=rsa; p=…'], 'DMARC' => ['host' => '_dmarc', 'value' => 'v=DMARC1; p=none; rua=mailto:dmarc@ziroemail.com']];
        foreach ($records as $type => $status) {
            $domain->records()->forceCreate(['type' => $type, 'status' => $status, 'expected' => $values[$type], 'last_checked_at' => now()->subMinutes(10), 'broken_since' => $status === 'passing' ? null : now()->subDays(2)]);
        }

        return $domain;
    }
}
