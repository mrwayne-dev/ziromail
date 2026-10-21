<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardOverviewTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $name = 'adaobifoods.com'): array
    {
        $user = User::factory()->create();
        $plan = Plan::query()->where('code', 'business')->first() ?? Plan::factory()->create(['code' => 'business', 'name' => 'Business', 'pool_gb' => 30]);
        $domain = Domain::factory()->withSubscription($plan, extraGb: 10)->create(['user_id' => $user->id, 'name' => $name]);
        Mailbox::factory()->create(['domain_id' => $domain->id, 'local_part' => 'sales', 'quota_gb' => 8, 'state' => 'active'])->forceFill(['used_gb' => 6.1])->save();

        return [$user, $domain];
    }

    public function test_the_overview_reads_this_accounts_domain_from_the_database(): void
    {
        [$user, $domain] = $this->account();
        $this->actingAs($user);

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Overview')
            ->where('domain.name', 'adaobifoods.com')
            ->where('domain.poolGb', 40)
            ->where('domain.usedGb', 6.1)
            ->where('stats.planName', 'Business')
            ->where('mailboxes.0.local', 'sales')
            ->where('mailboxes.0.state', 'near_full')
            ->where('alerts.0.id', fn ($id) => str_starts_with($id, 'quota-'))
            ->where('account.domains.0.id', $domain->id));
    }

    public function test_another_accounts_domain_is_invisible_even_when_its_id_is_asked_for(): void
    {
        [, $theirs] = $this->account('theirs.com');
        [$me] = $this->account('mine.com');
        $this->actingAs($me);

        $this->get('/dashboard?domain='.$theirs->id)->assertInertia(fn (Assert $page) => $page
            ->where('domain.name', 'mine.com')
            ->has('account.domains', 1));
    }

    public function test_an_account_with_no_domain_is_sent_to_onboarding(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertRedirect(route('onboarding.domain'));
    }

    public function test_the_response_carries_no_secrets_and_no_mail_content(): void
    {
        [$user] = $this->account();
        $this->actingAs($user);

        $json = json_encode($this->get('/dashboard')->viewData('page')['props']);

        foreach (['"password"', 'two_factor_secret', 'remember_token', 'verification_code', '"preview"', '"attachments"', '"bodyHtml"'] as $needle) {
            $this->assertStringNotContainsString($needle, $json);
        }
    }

    public function test_the_demo_seeder_builds_the_adaobi_account_and_refuses_production(): void
    {
        $this->seed(DemoSeeder::class);
        $owner = User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail();
        $this->actingAs($owner);

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('domain.name', 'adaobifoods.com')
            ->where('domain.poolGb', 40)
            ->where('domain.assignedGb', 26)
            ->where('activity.0.text', fn ($t) => is_string($t) && ! str_contains($t, '*')));

        $this->app['env'] = 'production';
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }
}
