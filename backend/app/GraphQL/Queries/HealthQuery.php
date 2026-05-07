<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\HealthService;

final class HealthQuery
{
    public function __construct(private readonly HealthService $healthService) {}

    /**
     * @param array<string,mixed> $args
     */
    public function health(mixed $_ = null, array $args = []): array
    {
        return $this->healthService->status();
    }
}
