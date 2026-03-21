<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface CamaraProviderInterface
{
    public function findDeputadoByNome(string $nome): ?array;
}
