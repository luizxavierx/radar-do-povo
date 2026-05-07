<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface SenadoProviderInterface
{
    public function findParlamentarByNome(string $nome): ?array;
}

