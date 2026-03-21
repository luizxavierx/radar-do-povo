<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\WikipediaProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Arr;
use RuntimeException;

final class WikipediaProvider implements WikipediaProviderInterface
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    public function summaryByUrl(string $wikipediaUrl): ?array
    {
        $wikipediaUrl = trim($wikipediaUrl);
        if ($wikipediaUrl === '') {
            return null;
        }

        $cacheKey = CacheKeyFactory::wikipediaByUrl($wikipediaUrl);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        if ($this->cache->has($cacheKey)) {
            $cached = $this->cache->get($cacheKey);
            return is_array($cached) ? $cached : null;
        }

        $title = $this->extractTitleFromUrl($wikipediaUrl);
        if ($title === null) {
            return null;
        }

        $summary = $this->fetchSummaryByTitle($title);
        if ($summary !== null) {
            $this->cache->put($cacheKey, $summary, $ttl);
        }

        return $summary;
    }

    private function extractTitleFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (!is_string($path) || trim($path) === '') {
            return null;
        }

        $segments = array_values(array_filter(explode('/', trim($path, '/'))));
        if ($segments === []) {
            return null;
        }

        $title = urldecode((string) end($segments));
        $title = trim($title);

        return $title !== '' ? $title : null;
    }

    private function fetchSummaryByTitle(string $title): ?array
    {
        $endpoint = 'https://pt.wikipedia.org/api/rest_v1/page/summary/' . rawurlencode($title);
        $response = $this->httpClient->make()
            ->withHeaders(['User-Agent' => 'RadarDoPovoAPI/1.0'])
            ->get($endpoint);

        if ($response->successful()) {
            $payload = $response->json();
            if (is_array($payload) && Arr::get($payload, 'title') !== null) {
                return [
                    'titulo' => Arr::get($payload, 'title'),
                    'resumo' => Arr::get($payload, 'extract'),
                    'url' => Arr::get($payload, 'content_urls.desktop.page'),
                    'fonte' => 'wikipedia_rest_api',
                ];
            }
        } elseif ($response->status() >= 500) {
            throw new RuntimeException('Falha em provider Wikipedia: status ' . $response->status());
        }

        return $this->fetchSummaryFromActionApi($title);
    }

    private function fetchSummaryFromActionApi(string $title): ?array
    {
        $response = $this->httpClient->make()
            ->withHeaders(['User-Agent' => 'RadarDoPovoAPI/1.0'])
            ->get('https://pt.wikipedia.org/w/api.php', [
                'action' => 'query',
                'prop' => 'extracts|info',
                'inprop' => 'url',
                'exintro' => 1,
                'explaintext' => 1,
                'redirects' => 1,
                'titles' => $title,
                'format' => 'json',
                'formatversion' => 2,
            ]);

        if (!$response->successful()) {
            if ($response->status() >= 500) {
                throw new RuntimeException('Falha fallback Wikipedia Action API: status ' . $response->status());
            }
            return null;
        }

        $payload = $response->json();
        if (!is_array($payload)) {
            return null;
        }

        $page = Arr::get($payload, 'query.pages.0');
        if (!is_array($page)) {
            return null;
        }

        $pageTitle = Arr::get($page, 'title');
        if (!is_string($pageTitle) || trim($pageTitle) === '') {
            return null;
        }

        return [
            'titulo' => $pageTitle,
            'resumo' => Arr::get($page, 'extract'),
            'url' => Arr::get($page, 'canonicalurl'),
            'fonte' => 'wikipedia_action_api',
        ];
    }
}
