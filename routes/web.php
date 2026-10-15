<?php

use Illuminate\Support\Facades\Route;

/*
 * Public marketing and legal pages. Prices and plan data are not served from
 * here yet: the pages read resources/js/fixtures/plans.js until the pricing
 * model is decided.
 */
Route::inertia('/', 'Public/Index')->name('home')->sitemap(1.0, 'weekly');
Route::inertia('/pricing', 'Public/Pricing')->name('pricing')->sitemap(0.9, 'weekly');
Route::inertia('/features', 'Public/Features')->name('features')->sitemap(0.8);
Route::inertia('/switching', 'Public/Migrate')->name('migrate')->sitemap(0.8);
Route::inertia('/help', 'Public/Help')->name('help')->sitemap(0.7, 'weekly');
Route::inertia('/contact', 'Public/Contact')->name('contact')->sitemap(0.6);
Route::inertia('/status', 'Public/Status')->name('status')->sitemap(0.5, 'daily');

Route::prefix('legal')->name('legal.')->group(function () {
    Route::inertia('/terms', 'Legal/Terms')->name('terms')->sitemap(0.3, 'yearly');
    Route::inertia('/privacy', 'Legal/Privacy')->name('privacy')->sitemap(0.3, 'yearly');
    Route::inertia('/aup', 'Legal/Aup')->name('aup')->sitemap(0.3, 'yearly');
    Route::inertia('/refunds', 'Legal/Refunds')->name('refunds')->sitemap(0.3, 'yearly');
});

/*
 * Destinations the public pages link to that belong to later phases (auth,
 * device setup, webmail). They are named now so `route()` resolves, and answer
 * 404 until their phase replaces these closures.
 */
foreach ([
    'login' => '/login',
    'signup' => '/signup',
    'setup.device' => '/setup',
    'mail' => '/mail',
] as $name => $uri) {
    Route::get($uri, fn () => abort(404))->name($name);
}

// The page the service worker will serve when the connection drops.
Route::inertia('/offline', 'Errors/Offline')->name('offline');

// Local-only previews of error states that are otherwise hard to trigger.
if (app()->environment('local')) {
    Route::prefix('_preview')->group(function () {
        Route::inertia('/404', 'Errors/NotFound');
        Route::inertia('/500', 'Errors/ServerError');
        Route::inertia('/maintenance', 'Errors/Maintenance');
    });
}
