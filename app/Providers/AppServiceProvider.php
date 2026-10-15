<?php

namespace App\Providers;

use Illuminate\Routing\Route;
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
        // Marks a route as public and indexable. `sitemap:generate` reads this
        // flag, so the sitemap follows the route list instead of a hand-kept file.
        Route::macro('sitemap', function (float $priority = 0.5, string $changefreq = 'monthly') {
            /** @var Route $this */
            $this->action['sitemap'] = compact('priority', 'changefreq');

            return $this;
        });
    }
}
