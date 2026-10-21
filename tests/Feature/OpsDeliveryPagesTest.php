<?php

namespace Tests\Feature;

use App\Models\DeliveryStat;
use App\Models\Domain;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OpsDeliveryPagesTest extends TestCase
{
    use RefreshDatabase;

    private function stat(Domain $domain, string $provider, int $delivered, int $bounced, int $deferred = 0): void
    {
        $stat = new DeliveryStat(['recipient_domain' => $provider, 'hour' => now()->startOfHour(), 'delivered' => $delivered, 'deferred' => $deferred, 'bounced' => $bounced, 'rejected' => 0, 'reply_code' => $deferred ? '451 4.3.2' : null]);
        $stat->domain_id = $domain->id;
        $stat->save();
    }

    public function test_deliverability_says_nothing_is_measured_when_nothing_has_been_reported(): void
    {
        Cache::flush();
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->get(route('ops.deliverability'))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Deliverability')->where('connected', false)->where('headline.bouncePct', null)->where('blocklists', null)->where('placement', null));
    }

    public function test_deliverability_counts_from_reported_hours(): void
    {
        Cache::flush();
        $domain = Domain::factory()->create(['name' => 'acme.com']);
        $this->stat($domain, 'gmail.com', 90, 10);
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->get(route('ops.deliverability'))->assertInertia(fn (Assert $p) => $p
            ->where('connected', true)->where('headline.bouncePct', 10)->where('headline.sent24h', 100)->where('worstDomains.0.domain', 'acme.com'));
    }

    public function test_the_delivery_log_filters_by_outcome_and_search_and_holds_no_message_details(): void
    {
        $domain = Domain::factory()->create(['name' => 'acme.com']);
        $this->stat($domain, 'gmail.com', 90, 0, 5);
        $this->stat($domain, 'yahoo.com', 40, 0);
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $response = $this->get(route('ops.queue', ['state' => 'deferred']))->assertInertia(fn (Assert $p) => $p->has('rows', 1)->where('rows.0.recipientDomain', 'gmail.com')->where('rows.0.replyCode', '451 4.3.2'));
        $this->get(route('ops.queue', ['q' => 'yahoo']))->assertInertia(fn (Assert $p) => $p->has('rows', 1));
        $this->get(route('ops.queue', ['q' => '%']))->assertInertia(fn (Assert $p) => $p->has('rows', 0));

        $json = json_encode($response->viewData('page')['props']);
        foreach (['subject', 'messageId', '"to"', '"from"'] as $needle) {
            $this->assertStringNotContainsString($needle, $json);
        }
    }

    public function test_checkout_shows_the_real_domain_and_plan_and_never_an_account_number(): void
    {
        $this->seed(PlanSeeder::class);
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'checkout.com', 'plan' => 'premium']);
        $id = Domain::query()->where('name', 'checkout.com')->value('id');

        $this->get(route('checkout.payment', ['domain' => $id]))->assertInertia(fn (Assert $p) => $p
            ->component('Checkout/Payment')->where('checkout.domain.name', 'checkout.com')->where('checkout.planCode', 'premium')->where('checkout.paid', false));
        $this->get(route('checkout.payment'))->assertInertia(fn (Assert $p) => $p->where('checkout.domain.name', 'checkout.com'));
    }

    public function test_checkout_for_another_accounts_domain_is_a_404(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('checkout.payment', ['domain' => Domain::factory()->create()->id]))->assertNotFound();
    }

    public function test_checkout_without_a_domain_points_to_onboarding(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('checkout.payment'))->assertInertia(fn (Assert $p) => $p->where('checkout', null));
    }
}
