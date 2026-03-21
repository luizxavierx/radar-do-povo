<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

interface HealthRepositoryInterface
{
    public function pingDatabase(): bool;

    public function pingRedis(): bool;
}
