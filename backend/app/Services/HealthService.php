<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\HealthRepositoryInterface;

final class HealthService
{
    public function __construct(private readonly HealthRepositoryInterface $repository) {}

    public function status(): array
    {
        $dbOk = $this->repository->pingDatabase();
        $redisOk = $this->repository->pingRedis();

        return [
            'status' => ($dbOk && $redisOk) ? 'ok' : 'degraded',
            'db' => $dbOk ? 'ok' : 'error',
            'redis' => $redisOk ? 'ok' : 'error',
            'timestamp' => now(),
        ];
    }
}
