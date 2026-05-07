<?php

declare(strict_types=1);

namespace App\Contracts\Providers;

interface WikipediaProviderInterface
{
    public function summaryByUrl(string $wikipediaUrl): ?array;
}
