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
require __DIR__.'/identity.php';

// Screens in the sign-in flow whose endpoints arrive in later identity steps (I4, I5).
Route::middleware('guest')->group(function () {
    Route::inertia('/forgot-password', 'Auth/ForgotPassword')->name('password.request');
});

Route::prefix('checkout')->name('checkout.')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'Checkout/Payment')->name('payment');
    Route::inertia('/transfer', 'Checkout/Transfer')->name('transfer');
});

Route::inertia('/setup', 'Setup/Device')->name('setup.device');

Route::prefix('onboarding')->name('onboarding.')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/domain', 'Onboarding/Domain')->name('domain');
    Route::inertia('/plan', 'Onboarding/Plan')->name('plan');
    Route::inertia('/records', 'Onboarding/Records')->name('records');
    Route::inertia('/assisted', 'Onboarding/Assisted')->name('assisted');
    Route::inertia('/mailboxes', 'Onboarding/Mailboxes')->name('mailboxes');
    Route::inertia('/done', 'Onboarding/Done')->name('done');
});

/*
 * The owner dashboard. Every screen reads fixtures (resources/js/fixtures) until
 * the organisation backend exists; only sign-in, verification and two-factor are
 * real. The guards are already the final ones.
 */
Route::prefix('dashboard')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'Dashboard/Index')->name('dashboard');
    Route::inertia('/mailboxes', 'Dashboard/Mailboxes')->name('dashboard.mailboxes');
    Route::inertia('/mailboxes/{mailbox}', 'Dashboard/Mailbox')->name('dashboard.mailboxes.show');
    Route::inertia('/domains', 'Dashboard/Domains')->name('dashboard.domains');
    Route::inertia('/domains/{domain}', 'Dashboard/Domain')->name('dashboard.domains.show');
    Route::inertia('/addresses', 'Dashboard/Aliases')->name('dashboard.aliases');
    Route::inertia('/team', 'Dashboard/Team')->name('dashboard.team');
    Route::inertia('/billing', 'Dashboard/Billing')->name('dashboard.billing');
    Route::inertia('/billing/storage', 'Dashboard/Storage')->name('dashboard.storage');
    Route::inertia('/activity', 'Dashboard/Audit')->name('dashboard.audit');
    Route::inertia('/help', 'Dashboard/Help')->name('dashboard.help');
});

/*
 * Webmail. Fixture-driven like the dashboard: the mailbox is demonstration data, the
 * sign-in is real. The open folder and message travel in the query string.
 */
Route::prefix('mail')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'Mail/Inbox')->name('mail');
    Route::inertia('/compose', 'Mail/Compose')->name('mail.compose');
    Route::inertia('/search', 'Mail/Search')->name('mail.search');
    Route::inertia('/contacts', 'Mail/Contacts')->name('mail.contacts');
    Route::inertia('/settings', 'Mail/Settings')->name('mail.settings');
});

/*
 * The operations console: behind the staff guard and mandatory two-factor. The data
 * on every screen is fixture (resources/js/fixtures/ops.js); the sign-in is real.
 */
Route::prefix('ops')->middleware(['auth:staff', 'staff.two-factor'])->group(function () {
    Route::inertia('/', 'Ops/Index')->name('ops');
    Route::inertia('/deliverability', 'Ops/Deliverability')->name('ops.deliverability');
    Route::inertia('/delivery-log', 'Ops/Queue')->name('ops.queue');
    Route::inertia('/domains', 'Ops/Domains')->name('ops.domains');
    Route::inertia('/abuse', 'Ops/Abuse')->name('ops.abuse');
    Route::inertia('/abuse/{flag}', 'Ops/AbuseDetail')->name('ops.abuse.show');
    Route::inertia('/organisations', 'Ops/Orgs')->name('ops.orgs');
    Route::inertia('/organisations/{org}', 'Ops/Org')->name('ops.orgs.show');
    Route::inertia('/mailboxes', 'Ops/Mailboxes')->name('ops.mailboxes');
    Route::inertia('/refunds', 'Ops/Refunds')->name('ops.refunds');
    Route::inertia('/backups', 'Ops/Backups')->name('ops.backups');
    Route::inertia('/staff', 'Ops/Staff')->name('ops.staff');
    Route::inertia('/audit', 'Ops/Audit')->name('ops.audit');
    Route::inertia('/reports', 'Ops/Reports')->name('ops.reports');
});

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
