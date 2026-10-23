<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Mailbox;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class WebmailPagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function screens(): array
    {
        return [
            'inbox' => ['/mail', 'Mail/Inbox'],
            'folder and message' => ['/mail?folder=sent&message=s1', 'Mail/Inbox'],
            'compose' => ['/mail/compose', 'Mail/Compose'],
            'search' => ['/mail/search?q=invoice', 'Mail/Search'],
            'contacts' => ['/mail/contacts', 'Mail/Contacts'],
            'settings' => ['/mail/settings', 'Mail/Settings'],
        ];
    }

    #[DataProvider('screens')]
    public function test_a_guest_is_sent_to_sign_in(string $uri): void
    {
        $this->get($uri)->assertRedirect(route('login'));
    }

    #[DataProvider('screens')]
    public function test_an_unverified_user_is_sent_to_verify_their_address(string $uri): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->get($uri)->assertRedirect(route('verification.notice'));
    }

    #[DataProvider('screens')]
    public function test_a_verified_user_gets_the_page(string $uri, string $component): void
    {
        $user = User::factory()->create();
        $domain = Domain::factory()->for($user)->withSubscription()->create();
        Mailbox::factory()->for($domain)->create();

        $this->actingAs($user);

        $this->get($uri)->assertInertia(fn (Assert $page) => $page->component($component));
    }

    public function test_a_verified_user_with_no_domain_is_sent_to_onboarding(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/mail')->assertRedirect(route('onboarding.domain'));
    }
}
