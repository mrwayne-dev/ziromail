<?php

use App\Http\Controllers\Checkout\CheckoutController;
use App\Http\Controllers\Dashboard\AliasController;
use App\Http\Controllers\Dashboard\AuditController;
use App\Http\Controllers\Dashboard\BillingController;
use App\Http\Controllers\Dashboard\DomainController;
use App\Http\Controllers\Dashboard\HelpController;
use App\Http\Controllers\Dashboard\MailboxController;
use App\Http\Controllers\Dashboard\OverviewController;
use App\Http\Controllers\Dashboard\StorageController;
use App\Http\Controllers\Dashboard\TeamController;
use App\Http\Controllers\Mail\MailController;
use App\Http\Controllers\Onboarding\OnboardingController;
use App\Http\Controllers\Ops\AbuseController as OpsAbuseController;
use App\Http\Controllers\Ops\AuditController as OpsAuditController;
use App\Http\Controllers\Ops\DeliverabilityController as OpsDeliverabilityController;
use App\Http\Controllers\Ops\DeliveryLogController as OpsDeliveryLogController;
use App\Http\Controllers\Ops\DomainController as OpsDomainController;
use App\Http\Controllers\Ops\MailboxController as OpsMailboxController;
use App\Http\Controllers\Ops\OverviewController as OpsOverviewController;
use App\Http\Controllers\Ops\ReportController as OpsReportController;
use App\Http\Controllers\Ops\SpamRulesController as OpsSpamRulesController;
use App\Http\Controllers\Ops\StaffController as OpsStaffController;
use App\Http\Controllers\Ops\UserController as OpsUserController;
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
    Route::get('/', CheckoutController::class)->name('payment');
});

Route::inertia('/setup', 'Setup/Device')->name('setup.device');

Route::prefix('onboarding')->name('onboarding.')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/domain', [OnboardingController::class, 'domain'])->name('domain');
    Route::post('/domain', [OnboardingController::class, 'storeDomain'])->middleware('throttle:domain-writes')->name('domain.store');
    Route::get('/plan', [OnboardingController::class, 'plan'])->name('plan');
    Route::put('/plan', [OnboardingController::class, 'updatePlan'])->middleware('throttle:domain-writes')->name('plan.update');
    Route::get('/records', [OnboardingController::class, 'records'])->name('records');
    Route::get('/assisted', [OnboardingController::class, 'assisted'])->name('assisted');
    Route::get('/mailboxes', [OnboardingController::class, 'mailboxes'])->name('mailboxes');
    Route::post('/mailboxes', [OnboardingController::class, 'storeMailboxes'])->middleware('throttle:mailbox-writes')->name('mailboxes.store');
    Route::get('/done', [OnboardingController::class, 'done'])->name('done');
});

/*
 * The owner dashboard. Every screen reads fixtures (resources/js/fixtures) until
 * the organisation backend exists; only sign-in, verification and two-factor are
 * real. The guards are already the final ones.
 */
Route::prefix('dashboard')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', OverviewController::class)->name('dashboard');
    Route::get('/mailboxes', [MailboxController::class, 'index'])->name('dashboard.mailboxes');
    Route::post('/mailboxes', [MailboxController::class, 'store'])->middleware('throttle:mailbox-writes')->name('dashboard.mailboxes.store');
    Route::get('/mailboxes/{mailbox}', [MailboxController::class, 'show'])->name('dashboard.mailboxes.show');
    Route::patch('/mailboxes/{mailbox}', [MailboxController::class, 'update'])->middleware('throttle:mailbox-writes')->name('dashboard.mailboxes.update');
    Route::post('/mailboxes/{mailbox}/suspend', [MailboxController::class, 'suspend'])->middleware('throttle:mailbox-writes')->name('dashboard.mailboxes.suspend');
    Route::delete('/mailboxes/{mailbox}', [MailboxController::class, 'destroy'])->middleware('throttle:mailbox-writes')->name('dashboard.mailboxes.destroy');
    Route::get('/domains', [DomainController::class, 'index'])->name('dashboard.domains');
    Route::post('/domains', [DomainController::class, 'store'])->middleware('throttle:domain-writes')->name('dashboard.domains.store');
    Route::get('/domains/{domain}', [DomainController::class, 'show'])->name('dashboard.domains.show');
    Route::post('/domains/{domain}/recheck', [DomainController::class, 'recheck'])->middleware('throttle:dns-recheck')->name('dashboard.domains.recheck');
    Route::get('/addresses', [AliasController::class, 'index'])->name('dashboard.aliases');
    Route::post('/addresses', [AliasController::class, 'store'])->middleware('throttle:alias-writes')->name('dashboard.aliases.store');
    Route::put('/addresses/{alias}', [AliasController::class, 'update'])->middleware('throttle:alias-writes')->name('dashboard.aliases.update');
    Route::delete('/addresses/{alias}', [AliasController::class, 'destroy'])->middleware('throttle:alias-writes')->name('dashboard.aliases.destroy');
    Route::get('/team', [TeamController::class, 'index'])->name('dashboard.team');
    Route::post('/team', [TeamController::class, 'invite'])->middleware('throttle:alias-writes')->name('dashboard.team.invite');
    Route::delete('/team/{member}', [TeamController::class, 'remove'])->middleware('password.confirm')->name('dashboard.team.remove');
    Route::delete('/team/delegations/{delegation}', [TeamController::class, 'withdraw'])->middleware('password.confirm')->name('dashboard.team.withdraw');
    Route::get('/billing', BillingController::class)->name('dashboard.billing');
    Route::get('/billing/storage', StorageController::class)->name('dashboard.storage');
    Route::get('/activity', [AuditController::class, 'index'])->name('dashboard.audit');
    Route::get('/activity/export', [AuditController::class, 'export'])->name('dashboard.audit.export');
    Route::get('/help', HelpController::class)->name('dashboard.help');
});

/*
 * Webmail. Settings is backed by real tables (display_name, quota, aliases, the
 * mailboxes.settings JSON blob); inbox, compose, search and contacts are flagged
 * `demo: true` and still show fixture messages until the mail server is picked.
 */
Route::prefix('mail')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [MailController::class, 'inbox'])->name('mail');
    Route::get('/compose', [MailController::class, 'compose'])->name('mail.compose');
    Route::get('/search', [MailController::class, 'search'])->name('mail.search');
    Route::get('/contacts', [MailController::class, 'contacts'])->name('mail.contacts');
    Route::get('/settings', [MailController::class, 'settings'])->name('mail.settings');
    Route::patch('/settings', [MailController::class, 'updateSettings'])->middleware('throttle:mailbox-writes')->name('mail.settings.update');
});

/*
 * The operations console: behind the staff guard and mandatory two-factor. The data
 * on every screen is fixture (resources/js/fixtures/ops.js); the sign-in is real.
 */
Route::prefix('ops')->middleware(['auth:staff', 'staff.two-factor'])->group(function () {
    Route::get('/', OpsOverviewController::class)->name('ops');
    Route::get('/deliverability', OpsDeliverabilityController::class)->name('ops.deliverability');
    Route::get('/delivery-log', OpsDeliveryLogController::class)->name('ops.queue');
    Route::get('/domains', [OpsDomainController::class, 'index'])->name('ops.domains');
    Route::get('/abuse', [OpsAbuseController::class, 'index'])->name('ops.abuse');
    Route::get('/abuse/{flag}', [OpsAbuseController::class, 'show'])->name('ops.abuse.show');
    Route::post('/abuse/{flag}/resolve', [OpsAbuseController::class, 'resolve'])->middleware('throttle:ops-writes')->name('ops.abuse.resolve');
    Route::post('/abuse/mailboxes/{mailbox}/unlock', [OpsAbuseController::class, 'unlock'])->middleware('throttle:ops-writes')->name('ops.abuse.unlock');
    Route::post('/abuse/mailboxes/{mailbox}/exempt', [OpsAbuseController::class, 'exempt'])->middleware('throttle:ops-writes')->name('ops.abuse.exempt');
    Route::get('/spam-rules', OpsSpamRulesController::class)->name('ops.spam-rules');
    Route::get('/users', [OpsUserController::class, 'index'])->name('ops.users');
    Route::get('/users/{user}', [OpsUserController::class, 'show'])->whereNumber('user')->name('ops.users.show');
    Route::get('/mailboxes', [OpsMailboxController::class, 'index'])->name('ops.mailboxes');
    Route::inertia('/refunds', 'Ops/Refunds')->name('ops.refunds');
    Route::inertia('/backups', 'Ops/Backups')->name('ops.backups');
    Route::get('/staff', OpsStaffController::class)->name('ops.staff');
    Route::get('/audit', [OpsAuditController::class, 'index'])->name('ops.audit');
    Route::get('/reports', OpsReportController::class)->name('ops.reports');
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
