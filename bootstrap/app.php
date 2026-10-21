<?php

use App\Http\Middleware\ConfigureStaffSession;
use App\Http\Middleware\EnforceTwoFactor;
use App\Http\Middleware\EnsureHttps;
use App\Http\Middleware\EnsureStaffSession;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequireStaffTwoFactor;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(EnsureHttps::class);
        $middleware->append(SecurityHeaders::class);
        $middleware->statefulApi();
        $middleware->authenticateSessions();
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('ops', 'ops/*') ? '/ops/login' : route('login'));
        $middleware->redirectUsersTo(fn (Request $request) => route('dashboard'));
        $middleware->alias(['staff.two-factor' => RequireStaffTwoFactor::class]);
        $middleware->web(prepend: [ConfigureStaffSession::class], append: [
            EnsureStaffSession::class,
            HandleInertiaRequests::class,
            EnforceTwoFactor::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash([
            'current_password', 'password', 'password_confirmation', 'code', 'recovery_code', 'token',
        ]);

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Branded error pages. Debug mode keeps the framework's own page so
        // stack traces stay visible locally.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $page = [
                404 => 'Errors/NotFound',
                500 => 'Errors/ServerError',
                503 => 'Errors/Maintenance',
            ][$response->getStatusCode()] ?? null;

            if ($page === null || config('app.debug') || $request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            // No route matched, so the web middleware (and its shared props) never ran.
            Inertia::share('site', [
                'name' => 'Ziroemail',
                'url' => rtrim(config('app.url'), '/'),
            ]);

            return Inertia::render($page)
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })->create();
