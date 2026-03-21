<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\BrasilIoProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Arr;
use RuntimeException;

final class BrasilIoProvider implements BrasilIoProviderInterface
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    public function searchCandidatosByNome(string $nome, int $limit = 5): ?array
    {
        $nome = trim($nome);
        if ($nome === '') {
            return null;
        }

        $token = trim((string) config('services.brasilio.token', ''));
        if ($token === '') {
            return null;
        }

        $limit = max(1, min($limit, 20));
        $cacheKey = CacheKeyFactory::brasilIoByNome($nome, $limit);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($nome, $limit, $token): ?array {
            $baseUrl = rtrim((string) config('services.brasilio.base_url', 'https://brasil.io'), '/');
            $datasetPath = (string) config('services.brasilio.eleicoes_dataset_path', '/api/dataset/eleicoes-brasil/candidatos/data/');
            $endpoint = $baseUrl . '/' . ltrim($datasetPath, '/');

            $response = $this->httpClient->make()
                ->withToken($token, 'Token')
                ->get($endpoint, [
                    'search' => $nome,
                    'page_size' => $limit,
                ]);

            if (!$response->successful()) {
                throw new RuntimeException('Falha em provider Brasil.IO: status ' . $response->status());
            }

            $payload = $response->json();
            if (!is_array($payload)) {
                return null;
            }

            $results = Arr::get($payload, 'results', []);
            if (!is_array($results)) {
                $results = [];
            }

            $candidatos = [];
            foreach ($results as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $candidatos[] = [
                    'anoEleicao' => isset($row['ano_eleicao']) ? (int) $row['ano_eleicao'] : null,
                    'siglaUf' => Arr::get($row, 'sigla_uf'),
                    'nomeUrna' => Arr::get($row, 'nome_urna_candidato'),
                    'nomeCompleto' => Arr::get($row, 'nome_candidato'),
                    'numeroCandidato' => Arr::get($row, 'numero_candidato'),
                    'siglaPartido' => Arr::get($row, 'sigla_partido'),
                    'descricaoCargo' => Arr::get($row, 'descricao_cargo'),
                    'situacaoCandidatura' => Arr::get($row, 'descricao_situacao_candidatura'),
                    'fonte' => 'brasil_io_eleicoes',
                ];
            }

            return [
                'total' => (int) Arr::get($payload, 'count', count($candidatos)),
                'candidatos' => $candidatos,
            ];
        });
    }
}

