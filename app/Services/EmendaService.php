<?php

declare(strict_types=1);

namespace App\Services;

use App\Cache\CacheKeyFactory;
use App\Contracts\Repositories\EmendaRepositoryInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

final class EmendaService
{
    public function __construct(
        private readonly EmendaRepositoryInterface $repository,
        private readonly CacheRepository $cache,
    ) {}

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array<string,mixed>
     */
    public function summaryByPoliticoId(string $politicoId, array $filtro): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $cacheKey = CacheKeyFactory::emendaResumo($politicoId, $filtro);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->summaryByPoliticoId($politicoId, $filtro),
        );
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listByPoliticoId(string $politicoId, array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::emendasList($politicoId, $filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->listByPoliticoId($politicoId, $filtro, $limit, $offset),
        );
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topGastadores(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::emendaTopGastadores($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topGastadores($filtro, $limit, $offset),
        );
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topPorPais(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::emendaTopPaises($filtro, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->topPorPais($filtro, $limit, $offset),
        );
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listConveniosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array
    {
        $codigoEmenda = trim($codigoEmenda);
        if ($codigoEmenda === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::emendaConveniosList($codigoEmenda, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->listConveniosByCodigoEmenda($codigoEmenda, $limit, $offset),
        );
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listFavorecidosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array
    {
        $codigoEmenda = trim($codigoEmenda);
        if ($codigoEmenda === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);
        $limit = max(1, min($limit, max(1, $maxNestedPageSize)));
        $offset = max(0, $offset);

        $cacheKey = CacheKeyFactory::emendaFavorecidosList($codigoEmenda, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->repository->listFavorecidosByCodigoEmenda($codigoEmenda, $limit, $offset),
        );
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function normalizeFiltro(array $filtro): array
    {
        $from = isset($filtro['anoInicio']) ? (int) $filtro['anoInicio'] : null;
        $to = isset($filtro['anoFim']) ? (int) $filtro['anoFim'] : null;
        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        $uf = isset($filtro['uf']) ? trim((string) $filtro['uf']) : null;
        $tipo = isset($filtro['tipoEmenda']) ? trim((string) $filtro['tipoEmenda']) : null;
        $pais = isset($filtro['pais']) ? trim((string) $filtro['pais']) : null;
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
            'anoInicio' => $from,
            'anoFim' => $to,
            'uf' => $uf !== '' ? $uf : null,
            'tipoEmenda' => $tipo !== '' ? $tipo : null,
            'pais' => $pais !== null && $pais !== '' ? mb_strtoupper($pais, 'UTF-8') : null,
            'apenasParlamentares' => $apenasParlamentares,
            'cargoParlamentar' => $cargoParlamentar,
        ];
    }
}
