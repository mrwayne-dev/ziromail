<?php

namespace Tests\Feature\Identity;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_every_response_carries_the_binding_security_headers(): void
    {
        $response = $this->get('https://ziroemail.test/');

        $response->assertOk()
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin')
            ->assertHeader('Cross-Origin-Resource-Policy', 'same-origin')
            ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
            ->assertHeader('Permissions-Policy', config('identity.headers.permissions_policy'));

        $csp = $response->headers->get('Content-Security-Policy');
        foreach (["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", 'upgrade-insecure-requests'] as $directive) {
            $this->assertStringContainsString($directive, $csp);
        }
        $this->assertStringNotContainsString('unsafe-inline', $csp);
        $this->assertStringNotContainsString('unsafe-eval', $csp);
    }

    public function test_the_csp_nonce_changes_on_every_request_and_is_on_the_inline_script(): void
    {
        $first = $this->get('/');
        $second = $this->get('/');

        preg_match("/'nonce-([^']+)'/", $first->headers->get('Content-Security-Policy'), $a);
        preg_match("/'nonce-([^']+)'/", $second->headers->get('Content-Security-Policy'), $b);

        $this->assertNotEmpty($a[1]);
        $this->assertNotSame($a[1], $b[1]);
        $this->assertStringContainsString('nonce="'.$a[1].'"', $first->getContent());
    }

    public function test_signed_in_surfaces_and_token_pages_are_never_cached(): void
    {
        foreach (['/login', '/signup', '/forgot-password', '/verify-email'] as $uri) {
            $this->get($uri)->assertHeader('Cache-Control', 'no-store, private');
        }
    }

    public function test_hsts_is_sent_only_over_https_in_production(): void
    {
        $this->get('/')->assertHeaderMissing('Strict-Transport-Security');

        $this->app['env'] = 'production';
        $this->get('https://ziroemail.test/')->assertHeader('Strict-Transport-Security', config('identity.headers.hsts'));
    }

    public function test_production_redirects_plain_http_to_https(): void
    {
        $this->app['env'] = 'production';

        $this->get('http://ziroemail.test/pricing')->assertStatus(301)->assertRedirect('https://ziroemail.test/pricing');
    }

    public function test_the_noscript_block_has_no_inline_style(): void
    {
        $html = $this->get('/')->getContent();

        $this->assertStringContainsString('noscript-msg', $html);
        $this->assertDoesNotMatchRegularExpression('/<noscript>.*style=/s', $html);
    }
}
