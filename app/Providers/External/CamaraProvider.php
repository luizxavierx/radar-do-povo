<?php

declare(strict_types=1);

namespace App\Providers\External;

use App\Cache\CacheKeyFactory;
use App\Contracts\Providers\CamaraProviderInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Arr;
use RuntimeException;

final class CamaraProvider implements CamaraProviderInterface
{
    public function __construct(
        private readonly ResilientHttpClient $httpClient,
        private readonly CacheRepository $cache,
    ) {}

    public function findDeputadoByNome(string $nome): ?array
    {
        $nome = trim($nome);
        if ($nome === '') {
            return null;
        }

        $cacheKey = CacheKeyFactory::camaraByNome($nome);
        $ttl = (int) config('radar.external_cache_ttl_seconds', 1800);

        return $this->cache->remember($cacheKey, $ttl, function () use ($nome): ?array {
            $response = $this->httpClient->make()->get(
                'https://dadosabertos.camara.leg.br/api/v2/deputados',
                [
                    'nome' => $nome,
                    'ordem' => 'ASC',
                    'ordenarPor' => 'nome',
                ]
            );

            if (!$response->successful()) {
                throw new RuntimeException('Falha em provider Camara: status ' . $response->status());
            }

            $payload = $response->json();
            $dados = Arr::get($payload, 'dados', []);
            if (!is_array($dados) || $dados === []) {
                return null;
            }

            $first = $dados[0];
            foreach ($dados as $item) {
                $candidateName = trim((string) Arr::get($item, 'nome', ''));
                if (mb_strtolower($candidateName) === mb_strtolower($nome)) {
                    $first = $item;
                    break;
                }
            }

            return [
                'id' => isset($first['id']) ? (string) $first['id'] : null,
                'nome' => Arr::get($first, 'nome'),
                'siglaPartido' => Arr::get($first, 'siglaPartido'),
                'siglaUf' => Arr::get($first, 'siglaUf'),
                'urlFoto' => Arr::get($first, 'urlFoto'),
                'email' => Arr::get($first, 'email'),
                'uri' => Arr::get($first, 'uri'),
                'fonte' => 'camara_dados_abertos',
            ];
        });
    }
}
