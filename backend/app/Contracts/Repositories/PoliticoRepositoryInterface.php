<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

interface PoliticoRepositoryInterface
{
    public function findById(string $id): ?array;

    public function findByNomeCanonico(string $nomeCanonico): ?array;

    /**
     * @return array{nodes: array<int, array<string,mixed>>, total: int}
     */
    public function list(array $filters, int $limit, int $offset): array;
}
