<?php

namespace App\Providers;

use App\Broadcasting\TestBroadcaster;
use App\Services\AccountContext;
use App\Services\Dns\DnsChecker;
use App\Services\Dns\FakeDnsChecker;
use App\Services\MailServer\FakeMailServer;
use App\Services\MailServer\MailServer;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(AccountContext::class);
        $this->app->bind(MailServer::class, FakeMailServer::class);
        $this->app->bind(DnsChecker::class, FakeDnsChecker::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Broadcast::extend('test', fn () => new TestBroadcaster);
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Counts every attempt, including ones that fail validation, so wrong current passwords are limited too.
        // Dashboard writes are limited per signed-in person, with the numbers in config/ziroemail.php.
        RateLimiter::for('mailbox-writes', fn (Request $request) => Limit::perHour(config('ziroemail.limits.mailboxes_per_hour'))->by('mailbox-writes:'.$request->user()?->getAuthIdentifier()));
        RateLimiter::for('domain-writes', fn (Request $request) => Limit::perHour(config('ziroemail.limits.domains_per_hour'))->by('domain-writes:'.$request->user()?->getAuthIdentifier()));
        RateLimiter::for('alias-writes', fn (Request $request) => Limit::perHour(config('ziroemail.limits.alias_changes_per_hour'))->by('alias-writes:'.$request->user()?->getAuthIdentifier()));
        RateLimiter::for('dns-recheck', fn (Request $request) => Limit::perMinute(config('ziroemail.limits.recheck_per_minute'))->by('dns-recheck:'.$request->user()?->getAuthIdentifier()));
        RateLimiter::for('ops-writes', fn (Request $request) => Limit::perHour(60)->by('ops-writes:'.$request->user('staff')?->getAuthIdentifier()));

        RateLimiter::for('password-change', fn (Request $request) => Limit::perHour(config('identity.password_change.per_hour_user'))->by('password-change:'.($request->user()?->getAuthIdentifier() ?? $request->ip())));

        // Marks a route as public and indexable. `sitemap:generate` reads this
        // flag, so the sitemap follows the route list instead of a hand-kept file.
        Route::macro('sitemap', function (float $priority = 0.5, string $changefreq = 'monthly') {
            /** @var Route $this */
            $this->action['sitemap'] = compact('priority', 'changefreq');

            return $this;
        });
    }
}
