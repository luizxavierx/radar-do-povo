<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\HealthRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

final class HealthRepository implements HealthRepositoryInterface
{
    public function pingDatabase(): bool
    {
        try {
            DB::select('SELECT 1');
            return true;
        } catch (Throwable) {
            return false;
        }
    }

    public function pingRedis(): bool
    {
        try {
            Cache::store('redis')->put('health:ping', 1, now()->addSeconds(10));
            return Cache::store('redis')->has('health:ping');
        } catch (Throwable) {
            return false;
        }
    }
}
