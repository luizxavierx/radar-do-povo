<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\PoliticoService;

final class PoliticoQuery
{
    public function __construct(private readonly PoliticoService $politicoService) {}

    /**
     * @param array<string,mixed> $args
     */
    public function politico(mixed $_, array $args): ?array
    {
        $id = isset($args['id']) ? trim((string) $args['id']) : '';
        $nomeCanonico = isset($args['nomeCanonico']) ? trim((string) $args['nomeCanonico']) : '';

        if ($id !== '') {
            return $this->politicoService->findById($id);
        }

        if ($nomeCanonico !== '') {
            return $this->politicoService->findByNomeCanonico($nomeCanonico);
        }

        return null;
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function politicos(mixed $_, array $args): array
    {
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $filters = $this->normalizeFilters($args['filter'] ?? []);

        $result = $this->politicoService->list(
            $filters,
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
        $maxPageSize = (int) config('radar.max_page_size', 20);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    private function normalizeFilters(array $input): array
    {
        $out = [];
        foreach (['search', 'partido', 'uf', 'cargoAtual'] as $key) {
            if (!isset($input[$key])) {
                continue;
            }
            $value = trim((string) $input[$key]);
            if ($value === '') {
                continue;
            }
            $out[$key] = $value;
        }

        return $out;
    }
}
