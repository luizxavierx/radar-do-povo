<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Services\EmendaService;

final class EmendaFieldResolver
{
    public function __construct(private readonly EmendaService $emendaService) {}

    /**
     * @param array<string,mixed> $emenda
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function convenios(array $emenda, array $args): array
    {
        $codigoEmenda = trim((string) ($emenda['codigo_emenda'] ?? ''));
        if ($codigoEmenda === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->emendaService->listConveniosByCodigoEmenda(
            $codigoEmenda,
            $pagination['limit'],
            $pagination['offset'],
        );

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $emenda
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function favorecidos(array $emenda, array $args): array
    {
        $codigoEmenda = trim((string) ($emenda['codigo_emenda'] ?? ''));
        if ($codigoEmenda === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->emendaService->listFavorecidosByCodigoEmenda(
            $codigoEmenda,
            $pagination['limit'],
            $pagination['offset'],
        );

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
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
