<?php

use App\Http\Middleware\HandleInertiaRequests;
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
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
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

            return Inertia::render($page)
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })->create();
