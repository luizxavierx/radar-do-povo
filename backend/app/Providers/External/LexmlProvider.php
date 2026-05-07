<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\LexmlProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use RuntimeException;

final class LexmlProvider implements LexmlProviderInterface
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    public function searchByTerm(string $term, int $maxRecords = 5): ?array
    {
        $term = trim($term);
        if ($term === '') {
            return null;
        }

        $maxRecords = max(1, min($maxRecords, 20));
        $cacheKey = CacheKeyFactory::lexmlByTerm($term, $maxRecords);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($term, $maxRecords): ?array {
            $endpoint = (string) config('services.lexml.search_url', 'https://www.lexml.gov.br/busca/search');
            $response = $this->httpClient->make()->get($endpoint, [
                'keyword' => $term,
            ]);

            if (!$response->successful()) {
                throw new RuntimeException('LexML provider failed with status ' . $response->status());
            }

            return $this->parseHtmlSearchResponse($response->body(), $maxRecords);
        });
    }

    /**
     * @return array{total:int, documentos: array<int,array<string,mixed>>}|null
     */
    private function parseHtmlSearchResponse(string $htmlRaw, int $maxRecords): ?array
    {
        $html = trim($htmlRaw);
        if ($html === '') {
            return [
                'total' => 0,
                'documentos' => [],
            ];
        }

        $total = 0;
        if (preg_match('/<span id="itemCount">([^<]+)<\/span>/i', $html, $countMatch) === 1) {
            $digits = preg_replace('/\D+/', '', html_entity_decode($countMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if (is_string($digits) && $digits !== '') {
                $total = (int) $digits;
            }
        }

        $docs = [];
        if (preg_match_all('/<div id="main_\d+" class="docHit">(.+?)<\/table><\/div>/is', $html, $blocks) > 0) {
            foreach ($blocks[1] as $block) {
                if (!is_string($block)) {
                    continue;
                }

                $titulo = $this->extractDocTitle($block);
                $url = $this->extractDocUrl($block);
                $data = $this->extractLabeledValue($block, 'Data');
                $identificador = $this->extractLabeledValue($block, 'URN');
                $tipo = $this->inferType($titulo, $identificador);

                $docs[] = [
                    'titulo' => $titulo,
                    'identificador' => $identificador,
                    'tipo' => $tipo,
                    'data' => $data,
                    'url' => $url,
                    'fonte' => 'lexml_busca',
                ];

                if (count($docs) >= $maxRecords) {
                    break;
                }
            }
        }

        return [
            'total' => max($total, count($docs)),
            'documentos' => $docs,
        ];
    }

    private function extractDocTitle(string $block): ?string
    {
        if (preg_match('/<b>\s*T[^<]{0,16}tulo[^<]*<\/b><\/td><td class="col3"><a [^>]*>(.*?)<\/a>/is', $block, $match) !== 1) {
            return null;
        }

        return $this->cleanHtmlText($match[1]);
    }

    private function extractDocUrl(string $block): ?string
    {
        if (preg_match('/<b>\s*T[^<]{0,16}tulo[^<]*<\/b><\/td><td class="col3"><a href="([^"]+)"/is', $block, $match) !== 1) {
            return null;
        }

        $href = html_entity_decode(trim($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($href === '') {
            return null;
        }

        if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
            return $href;
        }

        return 'https://www.lexml.gov.br' . (str_starts_with($href, '/') ? $href : '/' . $href);
    }

    private function extractLabeledValue(string $block, string $label): ?string
    {
        $labelQuoted = preg_quote($label, '/');
        $pattern = '/<b>\s*' . $labelQuoted . '[^<]*<\/b><\/td><td class="col3">(.*?)<\/td>/is';
        if (preg_match($pattern, $block, $match) !== 1) {
            return null;
        }

        return $this->cleanHtmlText($match[1]);
    }

    private function inferType(?string $titulo, ?string $identificador): ?string
    {
        $source = mb_strtoupper(trim((string) ($identificador ?? $titulo ?? '')), 'UTF-8');
        if ($source === '') {
            return null;
        }

        if (str_contains($source, 'LEI')) {
            return 'LEI';
        }
        if (str_contains($source, 'DECRETO')) {
            return 'DECRETO';
        }
        if (str_contains($source, 'PEC')) {
            return 'PEC';
        }
        if (str_contains($source, 'PROJETO')) {
            return 'PROJETO';
        }

        return null;
    }

    private function cleanHtmlText(string $input): ?string
    {
        $text = strip_tags($input);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $text = trim($text);

        return $text !== '' ? $text : null;
    }
}

