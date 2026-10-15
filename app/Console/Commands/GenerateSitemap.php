<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate {--path= : Where to write the file (default public/sitemap.xml)}';

    protected $description = 'Write public/sitemap.xml from the routes flagged with ->sitemap()';

    public function handle(): int
    {
        $base = rtrim(config('app.url'), '/');
        $lastmod = now()->toDateString();

        $entries = collect(RouteFacade::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => in_array('GET', $route->methods(), true) && isset($route->getAction()['sitemap']))
            ->sortByDesc(fn (Route $route) => $route->getAction()['sitemap']['priority'])
            ->map(function (Route $route) use ($base, $lastmod) {
                ['priority' => $priority, 'changefreq' => $changefreq] = $route->getAction()['sitemap'];
                $path = $route->uri() === '/' ? '/' : '/'.$route->uri();

                return sprintf(
                    "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%.1f</priority>\n  </url>",
                    htmlspecialchars($base.$path, ENT_XML1),
                    $lastmod,
                    $changefreq,
                    $priority,
                );
            });

        if ($entries->isEmpty()) {
            $this->error('No routes are flagged with ->sitemap(); refusing to write an empty sitemap.');

            return self::FAILURE;
        }

        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            ."<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
            .$entries->implode("\n")
            ."\n</urlset>\n";

        $path = $this->option('path') ?: public_path('sitemap.xml');
        file_put_contents($path, $xml);

        $this->info("Wrote {$entries->count()} URLs to {$path}");

        return self::SUCCESS;
    }
}
