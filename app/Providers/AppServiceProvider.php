<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Counts every attempt, including ones that fail validation, so wrong current passwords are limited too.
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
