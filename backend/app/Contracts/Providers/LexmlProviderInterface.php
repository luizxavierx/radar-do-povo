<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface LexmlProviderInterface
{
    /**
     * @return array{total:int, documentos: array<int,array<string,mixed>>}|null
     */
    public function searchByTerm(string $term, int $maxRecords = 5): ?array;
}

