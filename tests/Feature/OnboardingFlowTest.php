<?php

namespace Tests\Feature;

use App\Http\Requests\Dashboard\StoreDomainRequest;
use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnboardingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_submitting_a_domain_saves_it_and_moves_to_the_plan_step(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'Fresh-Shop.com', 'plan' => 'business']);

        $domain = Domain::query()->where('name', 'fresh-shop.com')->firstOrFail();
        $response->assertRedirect(route('onboarding.plan', ['domain' => $domain->id]));
        $this->assertSame($user->id, $domain->user_id);
        $this->assertSame(4, $domain->records()->count());
    }

    public function test_going_back_and_resubmitting_continues_the_same_setup(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'again.com', 'plan' => 'business']);
        $this->post(route('onboarding.domain.store'), ['name' => 'again.com', 'plan' => 'business'])->assertRedirect();

        $this->assertSame(1, Domain::query()->where('name', 'again.com')->count());
    }

    public function test_a_name_held_live_by_someone_else_gets_the_neutral_message(): void
    {
        Domain::factory()->live()->create(['name' => 'taken.com']);

        $this->actingAs(User::factory()->create())
            ->post(route('onboarding.domain.store'), ['name' => 'taken.com', 'plan' => 'business'], ['X-Inertia' => 'true'])
            ->assertSessionHasErrors(['name' => StoreDomainRequest::NEUTRAL]);
    }

    public function test_the_steps_read_the_accounts_own_domain(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'steps.com', 'plan' => 'business']);
        $id = Domain::query()->where('name', 'steps.com')->value('id');

        $this->get(route('onboarding.plan', ['domain' => $id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Onboarding/Plan')->where('onboarding.domain.name', 'steps.com'));
        $this->get(route('onboarding.records', ['domain' => $id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Onboarding/Records')->has('records', 4));
        $this->get(route('onboarding.mailboxes', ['domain' => $id]))->assertOk();
        $this->get(route('onboarding.assisted', ['domain' => $id]))->assertOk();
        $this->get(route('onboarding.done', ['domain' => $id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Onboarding/Done')->where('live', false));
    }

    public function test_another_accounts_domain_is_a_404_on_every_step(): void
    {
        $other = Domain::factory()->create();
        $this->actingAs(User::factory()->create());

        foreach (['plan', 'records', 'assisted', 'mailboxes', 'done'] as $step) {
            $this->get(route("onboarding.$step", ['domain' => $other->id]))->assertNotFound();
        }
        $this->put(route('onboarding.plan.update', ['domain' => $other->id]), ['plan' => 'business'])->assertNotFound();
        $this->post(route('onboarding.mailboxes.store'), ['domain' => $other->id, 'rows' => [['local_part' => 'a', 'quota_gb' => 1]]])->assertNotFound();
    }

    public function test_choosing_a_plan_updates_the_unpaid_subscription(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'plans.com', 'plan' => 'business']);
        $domain = Domain::query()->where('name', 'plans.com')->firstOrFail();

        $this->put(route('onboarding.plan.update', ['domain' => $domain->id]), ['plan' => 'starter'])
            ->assertRedirect(route('onboarding.records', ['domain' => $domain->id]));

        $this->assertSame('starter', $domain->fresh()->subscription->plan->code);
    }

    public function test_mailboxes_are_created_together_and_stay_inside_the_pool(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'pool.com', 'plan' => 'starter']);
        $domain = Domain::query()->where('name', 'pool.com')->firstOrFail();
        $pool = $domain->poolGb();

        $this->post(route('onboarding.mailboxes.store'), ['domain' => $domain->id, 'rows' => [['local_part' => 'one', 'quota_gb' => 1], ['local_part' => 'big', 'quota_gb' => $pool]]], ['X-Inertia' => 'true'])
            ->assertSessionHasErrors('rows');
        $this->assertSame(0, Mailbox::query()->where('domain_id', $domain->id)->count());

        $this->post(route('onboarding.mailboxes.store'), ['domain' => $domain->id, 'rows' => [['local_part' => 'one', 'quota_gb' => 1], ['local_part' => 'two', 'quota_gb' => 2]]])
            ->assertRedirect(route('onboarding.done', ['domain' => $domain->id]));
        $this->assertSame(2, Mailbox::query()->where('domain_id', $domain->id)->count());
    }

    public function test_duplicate_addresses_in_one_submission_are_refused_and_nothing_is_created(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('onboarding.domain.store'), ['name' => 'dupe.com', 'plan' => 'business']);
        $domain = Domain::query()->where('name', 'dupe.com')->firstOrFail();

        $this->post(route('onboarding.mailboxes.store'), ['domain' => $domain->id, 'rows' => [['local_part' => 'a', 'quota_gb' => 1], ['local_part' => 'A', 'quota_gb' => 1]]], ['X-Inertia' => 'true'])
            ->assertSessionHasErrors('rows');
        $this->assertSame(0, Mailbox::query()->where('domain_id', $domain->id)->count());
    }
}
