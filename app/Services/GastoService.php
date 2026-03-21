<?php

declare(strict_types=1);

namespace App\Services;

use App\Cache\CacheKeyFactory;
use App\Contracts\Repositories\GastoRepositoryInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

final class GastoService
{
    public function __construct(
        private readonly GastoRepositoryInterface $repository,
        private readonly CacheRepository $cache,
    ) {}

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public function summaryByPoliticoId(string $politicoId, array $periodo): array
    {
        $periodo = $this->normalizePeriodo($periodo);
        $cacheKey = CacheKeyFactory::gastoSummary($politicoId, $periodo);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember($cacheKey, $ttl, function () use ($politicoId, $periodo): array {
            $summaries = $this->repository->batchExpenseSummaryByPoliticoIds([$politicoId], $periodo);
            return $summaries[$politicoId] ?? $this->emptySummary($periodo);
        });
    }

    /**
     * @param array<int,string> $politicoIds
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     * @return array<string,array<string,mixed>>
     */
    public function batchSummaryByPoliticoIds(array $politicoIds, array $periodo): array
    {
        return $this->repository->batchExpenseSummaryByPoliticoIds($politicoIds, $this->normalizePeriodo($periodo));
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array<string,mixed>
     */
    public function summaryViagens(array $filtro): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $cacheKey = CacheKeyFactory::gastoResumoViagens($filtro);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->summaryViagens($filtro),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::gastoViagensPainel($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->listViagens($filtro, $limit, $offset),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topViajantes(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::gastoTopViajantes($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topViajantes($filtro, $limit, $offset),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topGastadoresViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::gastoTopGastadoresViagens($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topGastadoresViagens($filtro, $limit, $offset),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topOrgaosSuperioresViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::gastoTopOrgaosSuperioresViagens($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topOrgaosSuperioresViagens($filtro, $limit, $offset),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topOrgaosSolicitantesViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::gastoTopOrgaosSolicitantesViagens($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topOrgaosSolicitantesViagens($filtro, $limit, $offset),
        );
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listViagensByPoliticoId(string $politicoId, array $periodo, int $limit, int $offset): array
    {
        $periodo = $this->normalizePeriodo($periodo);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::viagensList($politicoId, $periodo, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember($cacheKey, $ttl, fn (): array => $this->repository->listViagensByPoliticoId(
            $politicoId,
            $periodo,
            $limit,
            $offset,
        ));
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listPassagensByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $batch = $this->batchPassagensByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listPagamentosByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $batch = $this->batchPagamentosByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listTrechosByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $batch = $this->batchTrechosByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchPassagensByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);
        $result = [];
        $missing = [];

        foreach ($processoIds as $processoId) {
            $pid = trim((string) $processoId);
            if ($pid === '') {
                continue;
            }

            $cacheKey = CacheKeyFactory::viagemPassagensList($pid, $limit, $offset);
            $cached = $this->cache->get($cacheKey);
            if (is_array($cached) && isset($cached['nodes'], $cached['total'])) {
                $result[$pid] = [
                    'nodes' => is_array($cached['nodes']) ? $cached['nodes'] : [],
                    'total' => (int) $cached['total'],
                ];
                continue;
            }

            $missing[$pid] = $pid;
        }

        if ($missing !== []) {
            $fetched = $this->repository->batchPassagensByProcessoIds(array_values($missing), $limit, $offset);
            foreach ($missing as $pid) {
                $value = $fetched[$pid] ?? ['nodes' => [], 'total' => 0];
                $result[$pid] = $value;
                $this->cache->put(CacheKeyFactory::viagemPassagensList($pid, $limit, $offset), $value, $ttl);
            }
        }

        return $result;
    }

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchPagamentosByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);
        $result = [];
        $missing = [];

        foreach ($processoIds as $processoId) {
            $pid = trim((string) $processoId);
            if ($pid === '') {
                continue;
            }

            $cacheKey = CacheKeyFactory::viagemPagamentosList($pid, $limit, $offset);
            $cached = $this->cache->get($cacheKey);
            if (is_array($cached) && isset($cached['nodes'], $cached['total'])) {
                $result[$pid] = [
                    'nodes' => is_array($cached['nodes']) ? $cached['nodes'] : [],
                    'total' => (int) $cached['total'],
                ];
                continue;
            }

            $missing[$pid] = $pid;
        }

        if ($missing !== []) {
            $fetched = $this->repository->batchPagamentosByProcessoIds(array_values($missing), $limit, $offset);
            foreach ($missing as $pid) {
                $value = $fetched[$pid] ?? ['nodes' => [], 'total' => 0];
                $result[$pid] = $value;
                $this->cache->put(CacheKeyFactory::viagemPagamentosList($pid, $limit, $offset), $value, $ttl);
            }
        }

        return $result;
    }

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchTrechosByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);
        $result = [];
        $missing = [];

        foreach ($processoIds as $processoId) {
            $pid = trim((string) $processoId);
            if ($pid === '') {
                continue;
            }

            $cacheKey = CacheKeyFactory::viagemTrechosList($pid, $limit, $offset);
            $cached = $this->cache->get($cacheKey);
            if (is_array($cached) && isset($cached['nodes'], $cached['total'])) {
                $result[$pid] = [
                    'nodes' => is_array($cached['nodes']) ? $cached['nodes'] : [],
                    'total' => (int) $cached['total'],
                ];
                continue;
            }

            $missing[$pid] = $pid;
        }

        if ($missing !== []) {
            $fetched = $this->repository->batchTrechosByProcessoIds(array_values($missing), $limit, $offset);
            foreach ($missing as $pid) {
                $value = $fetched[$pid] ?? ['nodes' => [], 'total' => 0];
                $result[$pid] = $value;
                $this->cache->put(CacheKeyFactory::viagemTrechosList($pid, $limit, $offset), $value, $ttl);
            }
        }

        return $result;
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     * @return array{anoInicio?:int|null,anoFim?:int|null}
     */
    private function normalizePeriodo(array $periodo): array
    {
        $from = isset($periodo['anoInicio']) ? (int) $periodo['anoInicio'] : null;
        $to = isset($periodo['anoFim']) ? (int) $periodo['anoFim'] : null;
        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [
            'anoInicio' => $from,
            'anoFim' => $to,
        ];
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array<string,mixed>
     */
    private function normalizeRankingFiltro(array $filtro): array
    {
        $periodo = $this->normalizePeriodo($filtro);
        $orgaoSuperiorCodigo = isset($filtro['orgaoSuperiorCodigo']) ? trim((string) $filtro['orgaoSuperiorCodigo']) : null;
        $orgaoSolicitanteCodigo = isset($filtro['orgaoSolicitanteCodigo']) ? trim((string) $filtro['orgaoSolicitanteCodigo']) : null;
        $search = isset($filtro['search']) ? trim((string) $filtro['search']) : null;
        $situacao = isset($filtro['situacao']) ? trim((string) $filtro['situacao']) : null;
        $processoId = isset($filtro['processoId']) ? trim((string) $filtro['processoId']) : null;
        $pcdp = isset($filtro['pcdp']) ? trim((string) $filtro['pcdp']) : null;
        $cpfViajante = isset($filtro['cpfViajante']) ? trim((string) $filtro['cpfViajante']) : null;
        $nomeViajante = isset($filtro['nomeViajante']) ? trim((string) $filtro['nomeViajante']) : null;
        $cargo = isset($filtro['cargo']) ? trim((string) $filtro['cargo']) : null;
        $funcao = isset($filtro['funcao']) ? trim((string) $filtro['funcao']) : null;
        $destino = isset($filtro['destino']) ? trim((string) $filtro['destino']) : null;
        $motivo = isset($filtro['motivo']) ? trim((string) $filtro['motivo']) : null;
        $apenasParlamentares = array_key_exists('apenasParlamentares', $filtro)
            ? (bool) $filtro['apenasParlamentares']
            : null;
        $cargoParlamentar = isset($filtro['cargoParlamentar'])
            ? mb_strtoupper(trim((string) $filtro['cargoParlamentar']), 'UTF-8')
            : null;

        if ($cargoParlamentar !== 'DEPUTADO' && $cargoParlamentar !== 'SENADOR') {
            $cargoParlamentar = null;
        }

        return [
            'anoInicio' => $periodo['anoInicio'],
            'anoFim' => $periodo['anoFim'],
            'orgaoSuperiorCodigo' => $orgaoSuperiorCodigo !== '' ? $orgaoSuperiorCodigo : null,
            'orgaoSolicitanteCodigo' => $orgaoSolicitanteCodigo !== '' ? $orgaoSolicitanteCodigo : null,
            'apenasParlamentares' => $apenasParlamentares,
            'cargoParlamentar' => $cargoParlamentar,
            'search' => $search !== '' ? $search : null,
            'situacao' => $situacao !== '' ? $situacao : null,
            'processoId' => $processoId !== '' ? $processoId : null,
            'pcdp' => $pcdp !== '' ? $pcdp : null,
            'cpfViajante' => $cpfViajante !== '' ? $cpfViajante : null,
            'nomeViajante' => $nomeViajante !== '' ? $nomeViajante : null,
            'cargo' => $cargo !== '' ? $cargo : null,
            'funcao' => $funcao !== '' ? $funcao : null,
            'destino' => $destino !== '' ? $destino : null,
            'motivo' => $motivo !== '' ? $motivo : null,
        ];
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    private function emptySummary(array $periodo): array
    {
        return [
            'totalViagens' => 0,
            'totalTrechos' => 0,
            'totalDiariasCents' => 0,
            'totalPassagensCents' => 0,
            'totalPagamentosCents' => 0,
            'totalOutrosGastosCents' => 0,
            'totalDevolucaoCents' => 0,
            'periodo' => $periodo,
        ];
    }
}
