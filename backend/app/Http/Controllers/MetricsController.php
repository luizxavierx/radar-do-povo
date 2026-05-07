<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\HealthService;
use Illuminate\Http\Response;

final class MetricsController extends Controller
{
    public function __construct(private readonly HealthService $healthService) {}

    public function __invoke(): Response
    {
        $health = $this->healthService->status();
        $db = $health['db'] === 'ok' ? 1 : 0;
        $redis = $health['redis'] === 'ok' ? 1 : 0;

        $lines = [
            '# HELP app_up Estado geral da API.',
            '# TYPE app_up gauge',
            'app_up ' . ($health['status'] === 'ok' ? '1' : '0'),
            '# HELP app_db_up Estado de conectividade do Postgres.',
            '# TYPE app_db_up gauge',
            "app_db_up {$db}",
            '# HELP app_redis_up Estado de conectividade do Redis.',
            '# TYPE app_redis_up gauge',
            "app_redis_up {$redis}",
            '# HELP app_memory_usage_bytes Memoria usada no processo PHP.',
            '# TYPE app_memory_usage_bytes gauge',
            'app_memory_usage_bytes ' . memory_get_usage(true),
        ];

        return response(implode("\n", $lines) . "\n", 200, [
            'Content-Type' => 'text/plain; version=0.0.4',
        ]);
    }
}
