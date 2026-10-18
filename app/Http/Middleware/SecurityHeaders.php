<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global security headers (docs/DASHBOARD_BUILD.md section 7.12). The CSP nonce is
 * created before the view renders so Vite and Ziggy tags carry it.
 */
class SecurityHeaders
{
    /** Paths whose pages carry a token or hold signed-in content and must never be cached. */
    private const UNCACHEABLE = [
        'dashboard*', 'mail*', 'ops*', 'onboarding*', 'checkout*', 'login*', 'signup', 'forgot-password',
        'reset-password*', 'verify-email*', 'confirm-password', 'user/*', 'logout',
    ];

    private const NO_REFERRER = ['reset-password*', 'verify-email*'];

    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        $response = $next($request);
        $headers = $response->headers;

        $headers->set('Content-Security-Policy', $this->policy($nonce, $request->secure()));
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('Referrer-Policy', $request->is(...self::NO_REFERRER) ? 'no-referrer' : 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', config('identity.headers.permissions_policy'));
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        $headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        if ($request->secure() && app()->isProduction()) {
            $headers->set('Strict-Transport-Security', config('identity.headers.hsts'));
        }

        if ($request->user() !== null || $request->is(...self::UNCACHEABLE)) {
            $headers->set('Cache-Control', 'no-store, private');
        }

        $headers->remove('X-Powered-By');

        return $response;
    }

    private function policy(string $nonce, bool $secure): string
    {
        $script = "'self' 'nonce-{$nonce}'";
        $style = "'self' 'nonce-{$nonce}'";
        $connect = "'self'";
        // Upgrading subresources only makes sense once the page itself arrived over HTTPS.
        $upgrade = $secure ? ' upgrade-insecure-requests' : '';

        // Local development only: the Vite dev server serves modules, styles and a websocket.
        if (app()->isLocal() && is_file(public_path('hot'))) {
            $dev = rtrim(trim((string) file_get_contents(public_path('hot'))), '/');
            $socket = str_replace(['http://', 'https://'], ['ws://', 'wss://'], $dev);
            $script .= " {$dev}";
            $style .= " {$dev} 'unsafe-inline'";
            $connect .= " {$dev} {$socket}";
        }

        return implode('; ', [
            "default-src 'self'",
            "script-src {$script}",
            "style-src {$style}",
            "img-src 'self' data:",
            "font-src 'self' data:",
            "connect-src {$connect}",
            "frame-src 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "manifest-src 'self'",
            "worker-src 'self'",
        ]).';'.$upgrade;
    }
}
