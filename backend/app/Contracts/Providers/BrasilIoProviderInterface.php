<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface BrasilIoProviderInterface
{
    /**
     * @return array{total:int, candidatos: array<int,array<string,mixed>>}|null
     */
    public function searchCandidatosByNome(string $nome, int $limit = 5): ?array;
}

