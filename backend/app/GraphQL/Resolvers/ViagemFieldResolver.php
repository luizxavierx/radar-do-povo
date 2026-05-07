<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\GraphQL\Support\ProcessoConnectionLoaderRegistry;
use GraphQL\Deferred;

final class ViagemFieldResolver
{
    public function __construct(private readonly ProcessoConnectionLoaderRegistry $loaderRegistry) {}

    /**
     * @param array<string,mixed> $viagem
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function passagens(array $viagem, array $args): Deferred|array
    {
        $processoId = trim((string) ($viagem['processo_id'] ?? ''));
        if ($processoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $loader = $this->loaderRegistry->passagens($pagination['limit'], $pagination['offset']);
        $loader->load($processoId);

        return new Deferred(function () use ($loader, $processoId, $pagination): array {
            $result = $loader->resolveFor($processoId);

            if (is_array($result) && isset($result['nodes'], $result['total'])) {
                return [
                    'nodes' => $result['nodes'],
                    'total' => (int) $result['total'],
                    'limit' => $pagination['limit'],
                    'offset' => $pagination['offset'],
                ];
            }

            return [
                'nodes' => [],
                'total' => 0,
                'limit' => $pagination['limit'],
                'offset' => $pagination['offset'],
            ];
        });
    }

    /**
     * @param array<string,mixed> $viagem
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function pagamentos(array $viagem, array $args): Deferred|array
    {
        $processoId = trim((string) ($viagem['processo_id'] ?? ''));
        if ($processoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $loader = $this->loaderRegistry->pagamentos($pagination['limit'], $pagination['offset']);
        $loader->load($processoId);

        return new Deferred(function () use ($loader, $processoId, $pagination): array {
            $result = $loader->resolveFor($processoId);

            if (is_array($result) && isset($result['nodes'], $result['total'])) {
                return [
                    'nodes' => $result['nodes'],
                    'total' => (int) $result['total'],
                    'limit' => $pagination['limit'],
                    'offset' => $pagination['offset'],
                ];
            }

            return [
                'nodes' => [],
                'total' => 0,
                'limit' => $pagination['limit'],
                'offset' => $pagination['offset'],
            ];
        });
    }

    /**
     * @param array<string,mixed> $viagem
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function trechos(array $viagem, array $args): Deferred|array
    {
        $processoId = trim((string) ($viagem['processo_id'] ?? ''));
        if ($processoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $loader = $this->loaderRegistry->trechos($pagination['limit'], $pagination['offset']);
        $loader->load($processoId);

        return new Deferred(function () use ($loader, $processoId, $pagination): array {
            $result = $loader->resolveFor($processoId);

            if (is_array($result) && isset($result['nodes'], $result['total'])) {
                return [
                    'nodes' => $result['nodes'],
                    'total' => (int) $result['total'],
                    'limit' => $pagination['limit'],
                    'offset' => $pagination['offset'],
                ];
            }

            return [
                'nodes' => [],
                'total' => 0,
                'limit' => $pagination['limit'],
                'offset' => $pagination['offset'],
            ];
        });
    }

    /**
     * @param array<string,mixed> $input
     * @return array{limit:int,offset:int}
     */
    private function normalizePagination(array $input): array
    {
        $limit = isset($input['limit']) ? (int) $input['limit'] : 20;
        $offset = isset($input['offset']) ? (int) $input['offset'] : 0;
        $maxNestedPageSize = (int) config('radar.max_nested_page_size', 10);

        return [
            'limit' => max(1, min($limit, max(1, $maxNestedPageSize))),
            'offset' => max(0, $offset),
        ];
    }
}
