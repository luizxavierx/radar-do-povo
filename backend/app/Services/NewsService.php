<?php

declare(strict_types=1);

namespace App\Services;

use App\Cache\CacheKeyFactory;
use DateTimeImmutable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Throwable;

final class NewsService
{
    private const TOKEN_STOPWORDS = [
        'a',
        'as',
        'da',
        'das',
        'de',
        'do',
        'dos',
        'e',
        'o',
        'os',
    ];

    public function __construct(private readonly CacheRepository $cache) {}

    /**
     * @return array{
     *     politico:string,
     *     total:int,
     *     fetched_at:string,
     *     items:array<int,array<string,mixed>>
     * }
     */
    public function latestByPolitico(string $politico, int $limit = 12): array
    {
        $politico = trim($politico);
        $limit = max(1, min($limit, max(1, (int) config('news.max_items', 12))));
        $cacheKey = CacheKeyFactory::newsByPolitico($politico, $limit);
        $ttl = (int) config('news.cache_ttl_seconds', config('radar.external_cache_ttl_seconds', 900));

        return $this->cache->remember($cacheKey, $ttl, function () use ($politico, $limit): array {
            $items = [];
            $normalizedPolitico = $this->normalizeText($politico);
            $tokens = $this->politicoTokens($politico);

            foreach ($this->feeds() as $feed) {
                foreach ($this->fetchFeedItems($feed) as $item) {
                    if (!$this->matchesPolitico($item, $normalizedPolitico, $tokens)) {
                        continue;
                    }

                    $items[] = $item;
                }
            }

            $items = $this->deduplicate($items);

            usort($items, function (array $left, array $right): int {
                $leftTimestamp = (int) ($left['published_timestamp'] ?? 0);
                $rightTimestamp = (int) ($right['published_timestamp'] ?? 0);

                if ($leftTimestamp === $rightTimestamp) {
                    return strcmp((string) ($right['title'] ?? ''), (string) ($left['title'] ?? ''));
                }

                return $rightTimestamp <=> $leftTimestamp;
            });

            $total = count($items);
            $items = array_slice($items, 0, $limit);
            $items = array_map(function (array $item): array {
                unset($item['published_timestamp'], $item['fingerprints']);
                return $item;
            }, $items);

            return [
                'politico' => $politico,
                'total' => $total,
                'fetched_at' => now()->toIso8601String(),
                'items' => $items,
            ];
        });
    }

    /**
     * @return array<int,array{key:string,label:string,url:string}>
     */
    private function feeds(): array
    {
        $feeds = config('news.feeds', []);
        if (!is_array($feeds)) {
            return [];
        }

        $normalized = [];
        foreach ($feeds as $feed) {
            if (!is_array($feed)) {
                continue;
            }

            $key = trim((string) ($feed['key'] ?? ''));
            $label = trim((string) ($feed['label'] ?? ''));
            $url = trim((string) ($feed['url'] ?? ''));

            if ($key === '' || $label === '' || $url === '') {
                continue;
            }

            $normalized[] = [
                'key' => $key,
                'label' => $label,
                'url' => $url,
            ];
        }

        return $normalized;
    }

    /**
     * @param array{key:string,label:string,url:string} $feed
     * @return array<int,array<string,mixed>>
     */
    private function fetchFeedItems(array $feed): array
    {
        $timeout = max(1, (int) config('news.http_timeout_seconds', 6));
        $retryTimes = max(0, (int) config('news.http_retry_times', 1));
        $retrySleepMs = max(1, (int) config('news.http_retry_sleep_ms', 150));

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
            ])
                ->timeout($timeout)
                ->retry($retryTimes, $retrySleepMs, throw: false)
                ->get($feed['url']);

            if (!$response->successful()) {
                Log::warning('Falha ao buscar feed RSS', [
                    'feed' => $feed['key'],
                    'status' => $response->status(),
                ]);

                return [];
            }

            return $this->parseFeed((string) $response->body(), $feed);
        } catch (Throwable $e) {
            Log::warning('Excecao ao buscar feed RSS', [
                'feed' => $feed['key'],
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * @param array{key:string,label:string,url:string} $feed
     * @return array<int,array<string,mixed>>
     */
    private function parseFeed(string $xml, array $feed): array
    {
        if (trim($xml) === '') {
            return [];
        }

        $previous = libxml_use_internal_errors(true);
        try {
            $document = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NOCDATA | LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if (!$document instanceof SimpleXMLElement) {
            return [];
        }

        $items = [];
        $namespaces = $document->getNamespaces(true);

        if (isset($document->channel->item)) {
            foreach ($document->channel->item as $node) {
                $parsed = $this->parseItem($node, $feed, $namespaces);
                if ($parsed !== null) {
                    $items[] = $parsed;
                }
            }

            return $items;
        }

        if (isset($document->entry)) {
            foreach ($document->entry as $node) {
                $parsed = $this->parseItem($node, $feed, $namespaces);
                if ($parsed !== null) {
                    $items[] = $parsed;
                }
            }
        }

        return $items;
    }

    /**
     * @param array<string,string> $namespaces
     * @param array{key:string,label:string,url:string} $feed
     * @return array<string,mixed>|null
     */
    private function parseItem(SimpleXMLElement $item, array $feed, array $namespaces): ?array
    {
        $title = $this->cleanText((string) ($item->title ?? ''));
        $link = $this->extractLink($item, $namespaces);
        $summary = $this->extractSummary($item, $namespaces);
        $publishedAt = $this->extractPublishedAt($item, $namespaces);

        if ($title === '' || $link === '') {
            return null;
        }

        $canonicalLink = $this->normalizeLink($link);
        $normalizedTitle = $this->normalizeText($title);

        return [
            'title' => $title,
            'link' => $canonicalLink !== '' ? $canonicalLink : $link,
            'summary' => Str::limit($summary, 280),
            'published_at' => $publishedAt?->format(DATE_ATOM),
            'published_timestamp' => $publishedAt?->getTimestamp() ?? 0,
            'source_name' => $feed['label'],
            'source_key' => $feed['key'],
            'fingerprints' => array_values(array_filter([
                $canonicalLink !== '' ? 'link:' . $canonicalLink : null,
                $normalizedTitle !== '' ? 'title:' . $normalizedTitle : null,
            ])),
        ];
    }

    /**
     * @param array<string,string> $namespaces
     */
    private function extractLink(SimpleXMLElement $item, array $namespaces): string
    {
        $link = trim((string) ($item->link ?? ''));
        if ($link !== '') {
            return $link;
        }

        if (isset($namespaces['atom'])) {
            foreach ($item->children($namespaces['atom'])->link as $atomLink) {
                $href = trim((string) ($atomLink->attributes()->href ?? ''));
                if ($href !== '') {
                    return $href;
                }
            }
        }

        foreach ($item->link as $rssLink) {
            $href = trim((string) ($rssLink->attributes()->href ?? ''));
            if ($href !== '') {
                return $href;
            }
        }

        return '';
    }

    /**
     * @param array<string,string> $namespaces
     */
    private function extractSummary(SimpleXMLElement $item, array $namespaces): string
    {
        $candidates = [
            (string) ($item->description ?? ''),
            (string) ($item->summary ?? ''),
        ];

        if (isset($namespaces['content'])) {
            $candidates[] = (string) ($item->children($namespaces['content'])->encoded ?? '');
        }

        foreach ($candidates as $candidate) {
            $cleaned = $this->cleanText($candidate);
            if ($cleaned !== '') {
                return $cleaned;
            }
        }

        return '';
    }

    /**
     * @param array<string,string> $namespaces
     */
    private function extractPublishedAt(SimpleXMLElement $item, array $namespaces): ?DateTimeImmutable
    {
        $candidates = [
            (string) ($item->pubDate ?? ''),
            (string) ($item->published ?? ''),
            (string) ($item->updated ?? ''),
        ];

        if (isset($namespaces['dc'])) {
            $candidates[] = (string) ($item->children($namespaces['dc'])->date ?? '');
        }

        foreach ($candidates as $candidate) {
            $value = trim($candidate);
            if ($value === '') {
                continue;
            }

            try {
                return new DateTimeImmutable($value);
            } catch (Throwable) {
                $timestamp = strtotime($value);
                if ($timestamp !== false) {
                    return (new DateTimeImmutable())->setTimestamp($timestamp);
                }
            }
        }

        return null;
    }

    /**
     * @param array<string,mixed> $item
     * @param array<int,string> $tokens
     */
    private function matchesPolitico(array $item, string $normalizedPolitico, array $tokens): bool
    {
        $haystack = $this->normalizeText(
            implode(' ', array_filter([
                (string) ($item['title'] ?? ''),
                (string) ($item['summary'] ?? ''),
            ])),
        );

        if ($haystack === '') {
            return false;
        }

        if ($normalizedPolitico !== '' && str_contains($haystack, $normalizedPolitico)) {
            return true;
        }

        if ($tokens === []) {
            return false;
        }

        $matched = 0;
        foreach ($tokens as $token) {
            if (str_contains($haystack, $token)) {
                $matched += 1;
            }
        }

        if (count($tokens) === 1) {
            return $matched === 1;
        }

        if (count($tokens) === 2) {
            return $matched === 2;
        }

        return $matched >= 2;
    }

    /**
     * @param array<int,array<string,mixed>> $items
     * @return array<int,array<string,mixed>>
     */
    private function deduplicate(array $items): array
    {
        $seen = [];
        $unique = [];

        foreach ($items as $item) {
            $fingerprints = is_array($item['fingerprints'] ?? null) ? $item['fingerprints'] : [];
            $isDuplicate = false;

            foreach ($fingerprints as $fingerprint) {
                if (!is_string($fingerprint) || $fingerprint === '') {
                    continue;
                }

                if (isset($seen[$fingerprint])) {
                    $isDuplicate = true;
                    break;
                }
            }

            if ($isDuplicate) {
                continue;
            }

            foreach ($fingerprints as $fingerprint) {
                if (!is_string($fingerprint) || $fingerprint === '') {
                    continue;
                }

                $seen[$fingerprint] = true;
            }

            $unique[] = $item;
        }

        return $unique;
    }

    /**
     * @return array<int,string>
     */
    private function politicoTokens(string $politico): array
    {
        $normalized = $this->normalizeText($politico);
        if ($normalized === '') {
            return [];
        }

        $tokens = preg_split('/\s+/', $normalized) ?: [];
        $tokens = array_values(array_unique(array_filter($tokens, function (string $token): bool {
            return mb_strlen($token, 'UTF-8') >= 3
                && !in_array($token, self::TOKEN_STOPWORDS, true);
        })));

        return $tokens;
    }

    private function cleanText(string $value): string
    {
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = strip_tags($value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
        return trim($value);
    }

    private function normalizeText(string $value): string
    {
        $value = $this->cleanText($value);
        if ($value === '') {
            return '';
        }

        $value = Str::ascii($value);
        $value = mb_strtolower($value, 'UTF-8');
        $value = preg_replace('/[^a-z0-9\s]/u', ' ', $value) ?? $value;
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim($value);
    }

    private function normalizeLink(string $link): string
    {
        $link = trim($link);
        if ($link === '') {
            return '';
        }

        $parts = parse_url($link);
        if (!is_array($parts)) {
            return $link;
        }

        $scheme = isset($parts['scheme']) ? strtolower((string) $parts['scheme']) : 'https';
        $host = isset($parts['host']) ? strtolower((string) $parts['host']) : '';
        $path = isset($parts['path']) ? rtrim((string) $parts['path'], '/') : '';
        $query = [];

        if (isset($parts['query'])) {
            parse_str((string) $parts['query'], $query);
            foreach (array_keys($query) as $key) {
                $normalizedKey = strtolower((string) $key);
                if (
                    str_starts_with($normalizedKey, 'utm_')
                    || in_array($normalizedKey, ['fbclid', 'gclid', 'cmpid'], true)
                ) {
                    unset($query[$key]);
                }
            }
        }

        $normalized = $scheme . '://' . $host . ($path !== '' ? $path : '/');
        if ($query !== []) {
            $normalized .= '?' . http_build_query($query);
        }

        return $normalized;
    }
}
