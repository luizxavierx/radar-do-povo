<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface TseProviderInterface
{
    public function candidateReferencesByNome(string $nome): ?array;
}

