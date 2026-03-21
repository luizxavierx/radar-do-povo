<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\TseProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

final class TseProvider implements TseProviderInterface
{
    public function __construct(private readonly CacheRepository $cache) {}

    public function candidateReferencesByNome(string $nome): ?array
    {
        $nome = trim($nome);
        if ($nome === '') {
            return null;
        }

        $cacheKey = CacheKeyFactory::tseByNome($nome);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($nome): array {
            $portalBase = rtrim((string) config('services.tse.portal_base_url', 'https://dadosabertos.tse.jus.br'), '/');
            $cdnBase = rtrim((string) config('services.tse.candidatos_cdn_base_url', 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand'), '/');
            $divulgaCandContas = rtrim((string) config('services.tse.divulgacandcontas_url', 'https://divulgacandcontas.tse.jus.br'), '/');

            return [
                'termoBusca' => $nome,
                'datasetCandidatosUrl' => $portalBase . '/dataset/candidatos',
                'datasetResultadosUrl' => $portalBase . '/dataset/resultados-2022',
                'candidatosCdnBaseUrl' => $cdnBase,
                'divulgaCandContasUrl' => $divulgaCandContas,
                'fonte' => 'tse_dados_abertos',
            ];
        });
    }
}

