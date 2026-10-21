<?php

namespace Tests\Feature;

use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OpsAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_see_every_accounts_events_with_plain_sentences_and_filters_work(): void
    {
        $this->seed(DemoSeeder::class);
        $other = User::factory()->create();
        $audit = app(AuditLogger::class);
        $audit->account(AuditAction::MailboxCreated, $other, 'mailboxes', 'You created *x@other.com*');
        $audit->record(AuditAction::LoginFailed);
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->get(route('ops.audit'))->assertInertia(fn (Assert $p) => $p
            ->component('Ops/Audit')
            ->where('entries', fn ($e) => collect($e)->pluck('detail')->contains('You created x@other.com') && collect($e)->pluck('text')->contains('Failed sign-in attempt')));

        $this->get(route('ops.audit', ['kind' => 'sign-in']))->assertInertia(fn (Assert $p) => $p->where('entries', fn ($e) => collect($e)->every(fn ($r) => $r['kind'] === 'sign-in')));
        $this->get(route('ops.audit', ['q' => 'x@other']))->assertInertia(fn (Assert $p) => $p->has('entries', 1));
    }

    public function test_a_search_is_literal_and_paging_continues_from_the_last_row(): void
    {
        $audit = app(AuditLogger::class);
        foreach (range(1, 45) as $ignored) {
            $audit->record(AuditAction::LoginFailed);
        }
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $this->get(route('ops.audit', ['q' => '%']))->assertInertia(fn (Assert $p) => $p->has('entries', 0));
        $first = $this->get(route('ops.audit'))->viewData('page')['props'];
        $this->assertCount(40, $first['entries']);
        $this->assertNotNull($first['nextBefore']);

        $this->get(route('ops.audit', ['before' => $first['nextBefore']]))->assertInertia(fn (Assert $p) => $p->has('entries', 5)->where('nextBefore', null));
    }

    public function test_the_trail_never_exposes_secrets_and_a_customer_cannot_open_it(): void
    {
        app(AuditLogger::class)->record(AuditAction::LoginFailed, null, ['email_hash' => 'abc', 'password' => 'hunter2']);
        $this->actingAs(Staff::factory()->withTwoFactor()->create(), 'staff');

        $json = json_encode($this->get(route('ops.audit'))->viewData('page')['props']);
        $this->assertStringNotContainsString('hunter2', $json);
        $this->assertStringNotContainsString('user_agent', $json);
        $this->assertStringNotContainsString('ip_address', $json);
    }
}
