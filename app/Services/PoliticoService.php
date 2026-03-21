<?php

declare(strict_types=1);

namespace App\Services;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\BrasilIoProviderInterface;
use App\Contracts\Providers\CamaraProviderInterface;
use App\Contracts\Providers\LexmlProviderInterface;
use App\Contracts\Providers\SenadoProviderInterface;
use App\Contracts\Providers\TseProviderInterface;
use App\Contracts\Providers\WikipediaProviderInterface;
use App\Contracts\Repositories\PoliticoRepositoryInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Log;
use Throwable;

final class PoliticoService
{
    public function __construct(
        private readonly PoliticoRepositoryInterface $repository,
        private readonly CamaraProviderInterface $camaraProvider,
        private readonly WikipediaProviderInterface $wikipediaProvider,
        private readonly SenadoProviderInterface $senadoProvider,
        private readonly TseProviderInterface $tseProvider,
        private readonly LexmlProviderInterface $lexmlProvider,
        private readonly BrasilIoProviderInterface $brasilIoProvider,
        private readonly CacheRepository $cache,
    ) {}

    public function findById(string $id): ?array
    {
        $cacheKey = CacheKeyFactory::politicoById($id);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember($cacheKey, $ttl, fn (): ?array => $this->repository->findById($id));
    }

    public function findByNomeCanonico(string $nomeCanonico): ?array
    {
        $cacheKey = CacheKeyFactory::politicoByNomeCanonico($nomeCanonico);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember(
            $cacheKey,
            $ttl,
            fn (): ?array => $this->repository->findByNomeCanonico($nomeCanonico),
        );
    }

    /**
     * @param array<string,mixed> $filters
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function list(array $filters, int $limit, int $offset): array
    {
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);
        $cacheKey = CacheKeyFactory::politicosList($filters, $limit, $offset);
        $ttl = (int) config('radar.query_cache_ttl_seconds', 300);

        return $this->cache->remember($cacheKey, $ttl, fn (): array => $this->repository->list($filters, $limit, $offset));
    }

    /**
     * @param array<int,string> $sources
     */
    public function externalProfileByPoliticoId(string $politicoId, array $sources = []): array
    {
        $requestedSources = $this->normalizeExternalSources($sources);
        $cacheKey = CacheKeyFactory::externalProfile($politicoId, array_keys($requestedSources));
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($politicoId, $requestedSources): array {
            $politico = $this->findById($politicoId);
            $nome = null;
            $wikipediaUrl = null;

            if (!$politico) {
                return [
                    'camara' => $this->emptyCamara(),
                    'wikipedia' => $this->emptyWikipedia(null),
                    'senado' => $this->emptySenado(),
                    'tse' => $this->emptyTse(null),
                    'lexml' => $this->emptyLexml(),
                    'brasilIo' => $this->emptyBrasilIo(),
                ];
            }

            $nome = $this->firstNotEmpty([
                $politico['nome_completo'] ?? null,
                $politico['nome_canonico'] ?? null,
                $politico['nome_busca'] ?? null,
            ]);
            $wikipediaUrl = isset($politico['wikipedia_url']) && is_string($politico['wikipedia_url'])
                ? trim((string) $politico['wikipedia_url'])
                : null;

            $camara = $this->emptyCamara();
            $wikipedia = $this->emptyWikipedia($wikipediaUrl !== '' ? $wikipediaUrl : null);
            $senado = $this->emptySenado();
            $tse = $this->emptyTse($nome);
            $lexml = $this->emptyLexml();
            $brasilIo = $this->emptyBrasilIo();

            try {
                if ($nome !== null && $this->shouldLoadSource($requestedSources, 'camara')) {
                    $camaraFound = $this->camaraProvider->findDeputadoByNome($nome);
                    if (is_array($camaraFound)) {
                        $camara = array_merge($camara, $camaraFound);
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider da Camara', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($nome !== null && $this->shouldLoadSource($requestedSources, 'senado')) {
                    $senadoFound = $this->senadoProvider->findParlamentarByNome($nome);
                    if (is_array($senadoFound)) {
                        $senado = array_merge($senado, $senadoFound);
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider do Senado', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($nome !== null && $this->shouldLoadSource($requestedSources, 'tse')) {
                    $tseFound = $this->tseProvider->candidateReferencesByNome($nome);
                    if (is_array($tseFound)) {
                        $tse = array_merge($tse, $tseFound);
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider do TSE', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($nome !== null && $this->shouldLoadSource($requestedSources, 'lexml')) {
                    $lexmlFound = $this->lexmlProvider->searchByTerm($nome, 5);
                    if (is_array($lexmlFound)) {
                        $lexml = $lexmlFound;
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider do LexML', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($nome !== null && $this->shouldLoadSource($requestedSources, 'brasilIo')) {
                    $brasilIoFound = $this->brasilIoProvider->searchCandidatosByNome($nome, 5);
                    if (is_array($brasilIoFound)) {
                        $brasilIo = $brasilIoFound;
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider do Brasil.IO', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if (
                    is_string($wikipediaUrl)
                    && trim($wikipediaUrl) !== ''
                    && $this->shouldLoadSource($requestedSources, 'wikipedia')
                ) {
                    $wikipediaFound = $this->wikipediaProvider->summaryByUrl($wikipediaUrl);
                    if (is_array($wikipediaFound)) {
                        $wikipedia = array_merge($wikipedia, $wikipediaFound);
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Falha ao buscar provider da Wikipedia', [
                    'politico_id' => $politicoId,
                    'error' => $e->getMessage(),
                ]);
            }

            return [
                'camara' => $camara,
                'wikipedia' => $wikipedia,
                'senado' => $senado,
                'tse' => $tse,
                'lexml' => $lexml,
                'brasilIo' => $brasilIo,
            ];
        });
    }

    /**
     * @param array<int,string> $sources
     * @return array<string,bool>
     */
    private function normalizeExternalSources(array $sources): array
    {
        $allowed = [
            'camara' => true,
            'wikipedia' => true,
            'senado' => true,
            'tse' => true,
            'lexml' => true,
            'brasilio' => true,
        ];

        $normalized = [];
        foreach ($sources as $source) {
            $key = mb_strtolower(trim((string) $source), 'UTF-8');
            if ($key === '') {
                continue;
            }
            if (!isset($allowed[$key])) {
                continue;
            }
            $normalized[$key] = true;
        }

        return $normalized;
    }

    /**
     * @param array<string,bool> $requestedSources
     */
    private function shouldLoadSource(array $requestedSources, string $source): bool
    {
        if ($requestedSources === []) {
            return true;
        }

        return isset($requestedSources[mb_strtolower($source, 'UTF-8')]);
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyCamara(): array
    {
        return [
            'id' => null,
            'nome' => null,
            'siglaPartido' => null,
            'siglaUf' => null,
            'urlFoto' => null,
            'email' => null,
            'uri' => null,
            'fonte' => 'camara_dados_abertos',
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptySenado(): array
    {
        return [
            'codigo' => null,
            'nome' => null,
            'nomeCompleto' => null,
            'siglaPartido' => null,
            'uf' => null,
            'email' => null,
            'urlFoto' => null,
            'urlPagina' => null,
            'afastadoAtual' => null,
            'fonte' => 'senado_dados_abertos',
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyTse(?string $nome): array
    {
        return [
            'termoBusca' => $nome,
            'datasetCandidatosUrl' => rtrim((string) config('services.tse.portal_base_url', 'https://dadosabertos.tse.jus.br'), '/') . '/dataset/candidatos',
            'datasetResultadosUrl' => rtrim((string) config('services.tse.portal_base_url', 'https://dadosabertos.tse.jus.br'), '/') . '/dataset/resultados-2022',
            'candidatosCdnBaseUrl' => rtrim((string) config('services.tse.candidatos_cdn_base_url', 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand'), '/'),
            'divulgaCandContasUrl' => rtrim((string) config('services.tse.divulgacandcontas_url', 'https://divulgacandcontas.tse.jus.br'), '/'),
            'fonte' => 'tse_dados_abertos',
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyLexml(): array
    {
        return [
            'total' => 0,
            'documentos' => [],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyBrasilIo(): array
    {
        return [
            'total' => 0,
            'candidatos' => [],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyWikipedia(?string $url): array
    {
        return [
            'titulo' => null,
            'resumo' => null,
            'url' => $url,
            'fonte' => 'wikipedia_rest_api',
        ];
    }

    /**
     * @param array<int,mixed> $values
     */
    private function firstNotEmpty(array $values): ?string
    {
        foreach ($values as $value) {
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }
}
