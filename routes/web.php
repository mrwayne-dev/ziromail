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
 * Sign-up, sign-in, checkout, phone setup and the onboarding wizard. These are
 * fixture-driven screens: nothing is submitted anywhere yet, and none of them
 * belongs in the sitemap.
 */
Route::inertia('/signup', 'Auth/Signup')->name('signup');
Route::inertia('/login', 'Auth/Login')->name('login');
Route::inertia('/login/two-factor', 'Auth/TwoFactor')->name('login.two-factor');
Route::inertia('/login/recovery', 'Auth/Recovery')->name('login.recovery');
Route::inertia('/forgot-password', 'Auth/ForgotPassword')->name('password.request');
Route::inertia('/verify-email', 'Auth/VerifyEmail')->name('verification.notice');

Route::prefix('checkout')->name('checkout.')->group(function () {
    Route::inertia('/', 'Checkout/Payment')->name('payment');
    Route::inertia('/transfer', 'Checkout/Transfer')->name('transfer');
});

Route::inertia('/setup', 'Setup/Device')->name('setup.device');

Route::prefix('onboarding')->name('onboarding.')->group(function () {
    Route::inertia('/domain', 'Onboarding/Domain')->name('domain');
    Route::inertia('/plan', 'Onboarding/Plan')->name('plan');
    Route::inertia('/records', 'Onboarding/Records')->name('records');
    Route::inertia('/assisted', 'Onboarding/Assisted')->name('assisted');
    Route::inertia('/mailboxes', 'Onboarding/Mailboxes')->name('mailboxes');
    Route::inertia('/done', 'Onboarding/Done')->name('done');
});

/*
 * Destinations the pages above link to that belong to later phases (webmail and
 * the owner dashboard). They are named now so `route()` resolves, and answer 404
 * until their phase replaces these closures.
 */
foreach ([
    'mail' => '/mail',
    'dashboard' => '/dashboard',
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
        Route::inertia('/components', 'Dev/Components');
    });
}
