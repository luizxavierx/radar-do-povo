<?php

declare(strict_types=1);

namespace App\Services;

use App\Cache\CacheKeyFactory;
use App\Exceptions\ImpostometroUnavailableException;
use App\Providers\External\ResilientHttpClient;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Arr;
use Throwable;

final class ImpostometroService
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    /**
     * @return array<string,mixed>
     */
    public function resumo(): array
    {
        $cacheKey = CacheKeyFactory::impostometroResumo();
        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        $apiUrl = trim((string) config('services.impostometro.api_url', ''));
        if ($apiUrl === '') {
            throw new ImpostometroUnavailableException('impostometro_nao_configurado', 503);
        }

        try {
            $response = $this->httpClient->make()
                ->withHeaders($this->headers())
                ->get($apiUrl);

            if (! $response->successful()) {
                return $this->staleOrFail('impostometro_fonte_indisponivel', 502);
            }

            $payload = $response->json();
            if (! is_array($payload)) {
                return $this->staleOrFail('impostometro_resposta_invalida', 502);
            }

            $normalized = $this->normalizePayload($payload);
            $ttl = (int) config('services.impostometro.cache_ttl_seconds', 300);
            $staleTtl = (int) config('services.impostometro.stale_ttl_seconds', 86400);

            $this->cache->put($cacheKey, $normalized, max(1, $ttl));
            $this->cache->put(CacheKeyFactory::impostometroResumoStale(), $normalized, max(1, $staleTtl));

            return $normalized;
        } catch (ImpostometroUnavailableException $exception) {
            throw $exception;
        } catch (Throwable) {
            return $this->staleOrFail('impostometro_fonte_indisponivel', 502);
        }
    }

    /**
     * @return array<string,string>
     */
    private function headers(): array
    {
        $token = trim((string) config('services.impostometro.api_token', ''));
        if ($token === '') {
            return [];
        }

        $header = trim((string) config('services.impostometro.token_header', 'Authorization'));
        $scheme = trim((string) config('services.impostometro.token_scheme', 'Bearer'));
        if ($header === '') {
            return [];
        }

        return [
            $header => $scheme !== '' ? "{$scheme} {$token}" : $token,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function staleOrFail(string $message, int $statusCode): array
    {
        $stale = $this->cache->get(CacheKeyFactory::impostometroResumoStale());
        if (is_array($stale)) {
            $stale['meta'] = is_array($stale['meta'] ?? null) ? $stale['meta'] : [];
            $stale['meta']['stale'] = true;

            return $stale;
        }

        throw new ImpostometroUnavailableException($message, $statusCode);
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    private function normalizePayload(array $payload): array
    {
        $meta = $this->arrayAt($payload, 'meta');
        $brasil = $this->arrayAt($payload, 'brasil');
        if ($brasil === []) {
            $brasil = $payload;
        }

        $valor = $this->numberFrom($brasil, [
            'valor',
            'total',
            'arrecadado',
            'valorTotal',
            'valor_total',
            'totalArrecadado',
            'total_arrecadado',
        ]) ?? $this->numberFrom($payload, [
            'valor',
            'total',
            'arrecadado',
            'valorTotal',
            'valor_total',
            'totalArrecadado',
            'total_arrecadado',
        ]);

        return [
            'meta' => [
                'coletado_em' => $this->stringFrom($meta, ['coletadoEm', 'coletado_em', 'collectedAt', 'collected_at'])
                    ?? now()->toISOString(),
                'periodo_inicio' => $this->stringFrom($meta, ['periodoInicio', 'periodo_inicio']),
                'periodo_fim' => $this->stringFrom($meta, ['periodoFim', 'periodo_fim']),
                'periodo_inicio_iso' => $this->stringFrom($meta, ['periodoInicioIso', 'periodo_inicio_iso']),
                'periodo_fim_iso' => $this->stringFrom($meta, ['periodoFimIso', 'periodo_fim_iso']),
                'ano_referencia' => $this->intFrom($meta, ['anoReferencia', 'ano_referencia'])
                    ?? (int) date('Y'),
                'fonte' => $this->stringFrom($meta, ['fonte', 'source'])
                    ?? (string) config('services.impostometro.source_label', 'Impostometro'),
            ],
            'brasil' => [
                'escopo' => $this->stringFrom($brasil, ['escopo', 'scope']) ?? 'BRASIL',
                'codigo' => $this->stringFrom($brasil, ['codigo', 'code']) ?? 'BR',
                'nome' => $this->stringFrom($brasil, ['nome', 'name']) ?? 'Brasil',
                'valor' => $valor,
                'valor_formatado' => $this->stringFrom($brasil, ['valorFormatado', 'valor_formatado', 'formatted'])
                    ?? ($valor !== null ? $this->formatCurrency($valor) : null),
                'valor_compacto' => $this->stringFrom($brasil, ['valorCompacto', 'valor_compacto', 'compact'])
                    ?? ($valor !== null ? $this->formatCompact($valor) : null),
                'uf' => $this->stringFrom($brasil, ['uf']),
            ],
            'tributos' => $this->normalizeTributos($this->arrayAt($payload, 'tributos')),
        ];
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    private function normalizeTributos(array $payload): array
    {
        return [
            'federal' => $this->normalizeTributoGroup($this->arrayAt($payload, 'federal'), 'federal'),
            'estadual' => $this->normalizeTributoGroup($this->arrayAt($payload, 'estadual'), 'estadual'),
            'municipal' => $this->normalizeTributoGroup($this->arrayAt($payload, 'municipal'), 'municipal'),
        ];
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    private function normalizeTributoGroup(array $payload, string $esfera): array
    {
        $total = $this->numberFrom($payload, ['total', 'valor', 'arrecadado']);
        $itens = Arr::get($payload, 'itens', Arr::get($payload, 'items', []));
        $normalizedItems = [];

        if (is_array($itens)) {
            foreach ($itens as $item) {
                if (! is_array($item)) {
                    continue;
                }

                $valor = $this->numberFrom($item, ['valor', 'total', 'arrecadado']);
                $normalizedItems[] = [
                    'nome' => $this->stringFrom($item, ['nome', 'name']),
                    'valor' => $valor,
                    'valor_formatado' => $this->stringFrom($item, ['valorFormatado', 'valor_formatado', 'formatted'])
                        ?? ($valor !== null ? $this->formatCurrency($valor) : null),
                    'valor_compacto' => $this->stringFrom($item, ['valorCompacto', 'valor_compacto', 'compact'])
                        ?? ($valor !== null ? $this->formatCompact($valor) : null),
                ];
            }
        }

        return [
            'esfera' => $this->stringFrom($payload, ['esfera', 'scope']) ?? $esfera,
            'total' => $total,
            'total_formatado' => $this->stringFrom($payload, ['totalFormatado', 'total_formatado', 'formatted'])
                ?? ($total !== null ? $this->formatCurrency($total) : null),
            'total_compacto' => $this->stringFrom($payload, ['totalCompacto', 'total_compacto', 'compact'])
                ?? ($total !== null ? $this->formatCompact($total) : null),
            'total_itens' => $this->intFrom($payload, ['totalItens', 'total_itens']) ?? count($normalizedItems),
            'itens' => $normalizedItems,
        ];
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    private function arrayAt(array $payload, string $key): array
    {
        $value = Arr::get($payload, $key);
        return is_array($value) ? $value : [];
    }

    /**
     * @param array<string,mixed> $payload
     * @param array<int,string> $keys
     */
    private function stringFrom(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);
            if (is_scalar($value) && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }

        return null;
    }

    /**
     * @param array<string,mixed> $payload
     * @param array<int,string> $keys
     */
    private function intFrom(array $payload, array $keys): ?int
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);
            if (is_numeric($value)) {
                return (int) $value;
            }
        }

        return null;
    }

    /**
     * @param array<string,mixed> $payload
     * @param array<int,string> $keys
     */
    private function numberFrom(array $payload, array $keys): ?float
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);
            if (is_int($value) || is_float($value)) {
                return (float) $value;
            }

            if (is_string($value)) {
                $parsed = $this->parseNumber($value);
                if ($parsed !== null) {
                    return $parsed;
                }
            }
        }

        return null;
    }

    private function parseNumber(string $value): ?float
    {
        $normalized = preg_replace('/[^\d,.\-]/', '', trim($value));
        if (! is_string($normalized) || $normalized === '') {
            return null;
        }

        if (str_contains($normalized, ',')) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        } elseif (substr_count($normalized, '.') > 1) {
            $normalized = str_replace('.', '', $normalized);
        }

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function formatCurrency(float $value): string
    {
        return 'R$ ' . number_format($value, 2, ',', '.');
    }

    private function formatCompact(float $value): string
    {
        $abs = abs($value);
        $units = [
            1_000_000_000_000.0 => ' tri',
            1_000_000_000.0 => ' bi',
            1_000_000.0 => ' mi',
            1_000.0 => ' mil',
        ];

        foreach ($units as $divisor => $suffix) {
            if ($abs >= $divisor) {
                return 'R$ ' . number_format($value / $divisor, 1, ',', '.') . $suffix;
            }
        }

        return $this->formatCurrency($value);
    }
}
