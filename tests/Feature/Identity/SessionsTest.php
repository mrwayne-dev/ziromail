<?php

namespace Tests\Feature\Identity;

use App\Identity\Support\Hmac;
use App\Identity\Support\UserAgentLabel;
use App\Models\User;
use App\Notifications\AccountSecurityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SessionsTest extends TestCase
{
    use RefreshDatabase;

    private function row(User $user, string $id, string $ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36', string $ip = '102.89.44.12'): void
    {
        DB::table('sessions')->insert(['id' => $id, 'user_id' => $user->id, 'ip_address' => $ip, 'user_agent' => $ua, 'payload' => 'x', 'last_activity' => time()]);
    }

    private function signedIn(User $user): static
    {
        return $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    }

    public function test_the_list_is_real_own_only_and_never_exposes_a_session_id(): void
    {
        $mine = User::factory()->create();
        $other = User::factory()->create();
        $this->row($mine, 'session-id-one');
        $this->row($mine, 'session-id-two', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Safari/604.1', '2001:db8:85a3::1');
        $this->row($other, 'someone-elses');

        $response = $this->actingAs($mine)->getJson(route('sessions.index'))->assertOk()->assertHeader('Cache-Control', 'no-store, private');

        $sessions = $response->json('sessions');
        $this->assertCount(2, $sessions);
        $body = $response->getContent();
        foreach (['session-id-one', 'session-id-two', 'someone-elses', '102.89.44.12'] as $secret) {
            $this->assertStringNotContainsString($secret, $body);
        }
        $this->assertContains('Chrome on Windows', array_column($sessions, 'label'));
        $this->assertContains('Safari on iOS', array_column($sessions, 'label'));
        $this->assertContains('102.89.44.x', array_column($sessions, 'ip'));
        $this->assertSame(Hmac::value('session', 'session-id-one'), collect($sessions)->firstWhere('label', 'Chrome on Windows')['handle']);
    }

    public function test_revoking_a_session_deletes_its_row_and_needs_a_confirmation(): void
    {
        $user = User::factory()->create();
        $this->row($user, 'old-phone');
        $handle = Hmac::value('session', 'old-phone');

        $this->actingAs($user)->deleteJson(route('sessions.destroy', $handle))->assertStatus(423);
        $this->assertSame(1, DB::table('sessions')->where('id', 'old-phone')->count());

        $this->signedIn($user)->deleteJson(route('sessions.destroy', $handle))->assertOk();
        $this->assertSame(0, DB::table('sessions')->where('id', 'old-phone')->count());
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.session_revoked']);
    }

    public function test_one_account_cannot_revoke_anothers_session(): void
    {
        $mine = User::factory()->create();
        $other = User::factory()->create();
        $this->row($other, 'victims');

        $this->signedIn($mine)->deleteJson(route('sessions.destroy', Hmac::value('session', 'victims')))->assertNotFound();
        $this->assertSame(1, DB::table('sessions')->where('id', 'victims')->count());
    }

    public function test_sign_out_everywhere_ends_every_other_session_rotates_the_remember_token_and_notifies(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $remember = $user->remember_token;
        $this->row($user, 'a');
        $this->row($user, 'b');
        $this->row(User::factory()->create(), 'not-mine');

        $this->actingAs($user)->postJson(route('sessions.revoke-others'))->assertStatus(423);

        $this->signedIn($user)->postJson(route('sessions.revoke-others'))->assertOk()->assertJson(['ended' => 2]);

        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->id)->count());
        $this->assertSame(1, DB::table('sessions')->where('id', 'not-mine')->count());
        $this->assertNotSame($remember, $user->fresh()->remember_token);
        $this->assertDatabaseHas('audit_log', ['action' => 'auth.sessions_revoked_all']);
        Notification::assertSentTo($user, AccountSecurityNotification::class);
    }

    public function test_a_session_is_signed_out_when_the_password_changes_elsewhere(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->withSession(['password_hash_web' => 'a-hash-that-no-longer-matches']);

        $this->get('/checkout')->assertRedirect(route('login'));
    }

    public function test_the_user_agent_label_never_returns_the_raw_agent(): void
    {
        $this->assertSame('Firefox on Linux', UserAgentLabel::label('Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'));
        $this->assertSame('Edge on Windows', UserAgentLabel::label('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36 Edg/120.0'));
        $this->assertSame('Chrome on Android', UserAgentLabel::label('Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36'));
        $this->assertSame('Browser on an unknown device', UserAgentLabel::label(null));
        $this->assertSame('2001:db8:85a3:…', UserAgentLabel::maskIp('2001:db8:85a3:0:0:8a2e:370:7334'));
    }
}
