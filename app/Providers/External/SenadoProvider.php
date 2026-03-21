<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\SenadoProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Arr;
use RuntimeException;

final class SenadoProvider implements SenadoProviderInterface
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    public function findParlamentarByNome(string $nome): ?array
    {
        $nome = trim($nome);
        if ($nome === '') {
            return null;
        }

        $cacheKey = CacheKeyFactory::senadoByNome($nome);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($nome): ?array {
            $baseUrl = rtrim((string) config('services.senado.base_url', 'https://legis.senado.leg.br/dadosabertos'), '/');
            $response = $this->httpClient->make()->get($baseUrl . '/dados/ListaParlamentarEmExercicio.json');

            if (!$response->successful()) {
                throw new RuntimeException('Falha em provider Senado: status ' . $response->status());
            }

            $payload = $response->json();
            if (!is_array($payload)) {
                return null;
            }

            $parlamentares = $this->extractParlamentares($payload);
            if ($parlamentares === []) {
                return null;
            }

            $selected = $this->bestMatch($parlamentares, $nome);
            if ($selected === null) {
                return null;
            }

            $codigo = $this->firstString([
                Arr::get($selected, 'IdentificacaoParlamentar.CodigoParlamentar'),
                Arr::get($selected, 'CodigoParlamentar'),
            ]);

            return [
                'codigo' => $codigo,
                'nome' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.NomeParlamentar'),
                    Arr::get($selected, 'NomeParlamentar'),
                ]),
                'nomeCompleto' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.NomeCompletoParlamentar'),
                    Arr::get($selected, 'NomeCompletoParlamentar'),
                ]),
                'siglaPartido' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.SiglaPartidoParlamentar'),
                    Arr::get($selected, 'SiglaPartidoParlamentar'),
                ]),
                'uf' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.UfParlamentar'),
                    Arr::get($selected, 'UfParlamentar'),
                ]),
                'email' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.EmailParlamentar'),
                    Arr::get($selected, 'EmailParlamentar'),
                ]),
                'urlFoto' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.UrlFotoParlamentar'),
                    Arr::get($selected, 'UrlFotoParlamentar'),
                ]),
                'urlPagina' => $this->firstString([
                    Arr::get($selected, 'IdentificacaoParlamentar.UrlPaginaParlamentar'),
                    Arr::get($selected, 'UrlPaginaParlamentar'),
                ]),
                'afastadoAtual' => $codigo !== null ? $this->isAfastado((string) $codigo, $baseUrl) : null,
                'fonte' => 'senado_dados_abertos',
            ];
        });
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<int,array<string,mixed>>
     */
    private function extractParlamentares(array $payload): array
    {
        $raw = Arr::get($payload, 'ListaParlamentarEmExercicio.Parlamentares.Parlamentar');
        if (is_array($raw)) {
            if ($this->isAssociative($raw)) {
                return [$raw];
            }

            return array_values(array_filter($raw, static fn ($item): bool => is_array($item)));
        }

        $out = [];
        $this->collectParlamentarCandidates($payload, $out);

        $dedup = [];
        foreach ($out as $item) {
            $code = trim((string) (Arr::get($item, 'IdentificacaoParlamentar.CodigoParlamentar') ?? Arr::get($item, 'CodigoParlamentar') ?? ''));
            $name = trim((string) (Arr::get($item, 'IdentificacaoParlamentar.NomeParlamentar') ?? Arr::get($item, 'NomeParlamentar') ?? ''));
            $key = $code . '|' . mb_strtolower($name);
            if ($key === '|') {
                continue;
            }
            $dedup[$key] = $item;
        }

        return array_values($dedup);
    }

    /**
     * @param array<string,mixed> $node
     * @param array<int,array<string,mixed>> $out
     */
    private function collectParlamentarCandidates(array $node, array &$out): void
    {
        if ($this->looksLikeParlamentar($node)) {
            $out[] = $node;
        }

        foreach ($node as $value) {
            if (is_array($value)) {
                $this->collectParlamentarCandidates($value, $out);
            }
        }
    }

    /**
     * @param array<string,mixed> $item
     */
    private function looksLikeParlamentar(array $item): bool
    {
        return $this->firstString([
            Arr::get($item, 'IdentificacaoParlamentar.CodigoParlamentar'),
            Arr::get($item, 'CodigoParlamentar'),
        ]) !== null
            || $this->firstString([
                Arr::get($item, 'IdentificacaoParlamentar.NomeParlamentar'),
                Arr::get($item, 'NomeParlamentar'),
            ]) !== null;
    }

    /**
     * @param array<int,array<string,mixed>> $items
     * @return array<string,mixed>|null
     */
    private function bestMatch(array $items, string $nome): ?array
    {
        $target = $this->normalizeName($nome);
        if ($target === '') {
            return null;
        }

        foreach ($items as $item) {
            $candidate = $this->firstString([
                Arr::get($item, 'IdentificacaoParlamentar.NomeParlamentar'),
                Arr::get($item, 'NomeParlamentar'),
                Arr::get($item, 'IdentificacaoParlamentar.NomeCompletoParlamentar'),
                Arr::get($item, 'NomeCompletoParlamentar'),
            ]);
            if ($candidate === null) {
                continue;
            }
            if ($this->normalizeName($candidate) === $target) {
                return $item;
            }
        }

        $targetTokens = $this->nameTokens($target);
        $bestItem = null;
        $bestScore = 0;
        foreach ($items as $item) {
            $candidate = $this->firstString([
                Arr::get($item, 'IdentificacaoParlamentar.NomeParlamentar'),
                Arr::get($item, 'NomeParlamentar'),
                Arr::get($item, 'IdentificacaoParlamentar.NomeCompletoParlamentar'),
                Arr::get($item, 'NomeCompletoParlamentar'),
            ]);
            if ($candidate === null) {
                continue;
            }

            $score = $this->tokenMatchScore($targetTokens, $this->nameTokens($this->normalizeName($candidate)));
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestItem = $item;
            }
        }

        return $bestScore > 0 ? $bestItem : null;
    }

    private function isAfastado(string $codigoParlamentar, string $baseUrl): ?bool
    {
        $response = $this->httpClient->make()->get($baseUrl . '/dados/AfastamentoAtual.json');
        if (!$response->successful()) {
            return null;
        }

        $payload = $response->json();
        if (!is_array($payload)) {
            return null;
        }

        $codes = [];
        $this->collectCodes($payload, $codes);
        if ($codes === []) {
            return null;
        }

        return in_array($codigoParlamentar, $codes, true);
    }

    /**
     * @param array<string,mixed> $node
     * @param array<int,string> $codes
     */
    private function collectCodes(array $node, array &$codes): void
    {
        $candidate = $this->firstString([
            Arr::get($node, 'CodigoParlamentar'),
            Arr::get($node, 'IdentificacaoParlamentar.CodigoParlamentar'),
        ]);
        if ($candidate !== null) {
            $codes[] = $candidate;
        }

        foreach ($node as $value) {
            if (is_array($value)) {
                $this->collectCodes($value, $codes);
            }
        }
    }

    /**
     * @param array<int,string> $target
     * @param array<int,string> $candidate
     */
    private function tokenMatchScore(array $target, array $candidate): int
    {
        if ($target === [] || $candidate === []) {
            return 0;
        }

        $candidateSet = array_fill_keys($candidate, true);
        $score = 0;
        foreach ($target as $token) {
            if (isset($candidateSet[$token])) {
                $score++;
            }
        }

        return $score;
    }

    /**
     * @param array<int,mixed> $values
     */
    private function firstString(array $values): ?string
    {
        foreach ($values as $value) {
            if (!is_string($value)) {
                continue;
            }
            $trimmed = trim($value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return null;
    }

    private function normalizeName(string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            return '';
        }

        if (function_exists('iconv')) {
            $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
            if ($ascii !== false) {
                $name = $ascii;
            }
        }

        $name = mb_strtolower($name, 'UTF-8');
        $name = preg_replace('/[^a-z0-9]+/u', ' ', $name) ?? $name;

        return trim(preg_replace('/\s+/u', ' ', $name) ?? $name);
    }

    /**
     * @return array<int,string>
     */
    private function nameTokens(string $normalizedName): array
    {
        $stopWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
        $parts = preg_split('/\s+/u', $normalizedName) ?: [];
        $tokens = [];

        foreach ($parts as $part) {
            if ($part === '' || in_array($part, $stopWords, true) || mb_strlen($part, 'UTF-8') < 3) {
                continue;
            }
            $tokens[] = $part;
        }

        return array_values(array_unique($tokens));
    }

    /**
     * @param array<string,mixed> $value
     */
    private function isAssociative(array $value): bool
    {
        if ($value === []) {
            return false;
        }

        return array_keys($value) !== range(0, count($value) - 1);
    }
}

