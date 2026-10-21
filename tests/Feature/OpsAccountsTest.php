<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OpsAccountsTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): Staff
    {
        return Staff::factory()->withTwoFactor()->create();
    }

    public function test_staff_can_find_an_account_by_business_email_domain_or_mailbox_address(): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs($this->staff(), 'staff');

        foreach (['Adaobi Foods', 'owner@adaobifoods', 'adaobiexport', 'sales@adaobifoods'] as $term) {
            $this->get(route('ops.users', ['q' => $term]))->assertInertia(fn (Assert $p) => $p
                ->component('Ops/Users')->where('page.total', 1)->where('rows.0.business', 'Adaobi Foods Ltd'), $term);
        }

        $this->get(route('ops.users', ['q' => 'nobody-matches']))->assertInertia(fn (Assert $p) => $p->where('page.total', 0));
    }

    public function test_a_search_term_is_matched_literally_not_as_a_wildcard(): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs($this->staff(), 'staff');

        $this->get(route('ops.users', ['q' => '%']))->assertInertia(fn (Assert $p) => $p->where('page.total', 0));
        $this->get(route('ops.users', ['q' => '_']))->assertInertia(fn (Assert $p) => $p->where('page.total', 0));
    }

    public function test_the_account_page_shows_sizes_and_states_and_never_mail_or_secrets(): void
    {
        $this->seed(DemoSeeder::class);
        $owner = User::query()->where('email', 'owner@adaobifoods.test')->firstOrFail();
        $this->actingAs($this->staff(), 'staff');

        $response = $this->get(route('ops.users.show', $owner->id))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/User')
            ->where('user.business', 'Adaobi Foods Ltd')
            ->has('domains', 2)
            ->where('domains.0.mailboxes.0.address', fn ($a) => str_contains($a, '@adaobifoods.com')));

        $json = json_encode($response->viewData('page')['props']);
        foreach (['"password"', 'two_factor_secret', 'remember_token', 'verification_code', '"preview"', '"bodyHtml"', '"attachments"'] as $needle) {
            $this->assertStringNotContainsString($needle, $json);
        }
    }

    public function test_the_domains_page_marks_a_name_that_several_accounts_claim(): void
    {
        $first = Domain::factory()->create(['name' => 'shared.com']);
        $first->goLive();
        Domain::factory()->create(['name' => 'shared.com']);
        Mailbox::factory()->create(['domain_id' => $first->id]);
        $this->actingAs($this->staff(), 'staff');

        $this->get(route('ops.domains', ['q' => 'shared.com']))->assertInertia(fn (Assert $p) => $p
            ->where('page.total', 2)
            ->where('rows', fn ($rows) => collect($rows)->where('contested', true)->count() === 1 && collect($rows)->where('state', 'live')->count() === 1));
        $this->get(route('ops.domains', ['filter' => 'live']))->assertInertia(fn (Assert $p) => $p->where('page.total', 1));
    }

    public function test_the_overview_counts_real_rows_and_invents_no_mail_figures(): void
    {
        $this->seed(DemoSeeder::class);
        $this->actingAs($this->staff(), 'staff');

        $response = $this->get('/ops')->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Index')
            ->where('figures.users', 1)
            ->where('figures.domains', 2)
            ->where('figures.mailboxes', 6)
            ->where('figures.assignedGb', 30));

        $json = json_encode($response->viewData('page')['props']);
        foreach (['bounceRate', 'queueAge', 'blocklist', 'mail24h'] as $invented) {
            $this->assertStringNotContainsString($invented, $json);
        }
    }

    public function test_a_customer_cannot_reach_the_ops_account_pages(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->get(route('ops.users'))->assertRedirect('/ops/login');
        $this->get(route('ops.users.show', $user->id))->assertRedirect('/ops/login');
        $this->get(route('ops.domains'))->assertRedirect('/ops/login');
    }

    public function test_no_ops_route_can_read_mail(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes())->filter(fn ($r) => str_starts_with($r->uri(), 'ops'))->map->uri()->implode(' ');

        // Whole words: `ops/mailboxes` is a sizes-and-states page, not a way into anyone's mail.
        foreach (['mail', 'message', 'messages', 'inbox', 'impersonate', 'view-as'] as $word) {
            $this->assertDoesNotMatchRegularExpression('#(^|[/ ])'.$word.'($|[/ ])#', $routes, "An ops route mentions '$word'.");
        }
    }
}
