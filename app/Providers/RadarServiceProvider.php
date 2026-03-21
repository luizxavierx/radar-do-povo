<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\Providers\CamaraProviderInterface;
use App\Contracts\Providers\BrasilIoProviderInterface;
use App\Contracts\Providers\LexmlProviderInterface;
use App\Contracts\Providers\SenadoProviderInterface;
use App\Contracts\Providers\TseProviderInterface;
use App\Contracts\Providers\WikipediaProviderInterface;
use App\Contracts\Repositories\EmendaRepositoryInterface;
use App\Contracts\Repositories\GastoRepositoryInterface;
use App\Contracts\Repositories\HealthRepositoryInterface;
use App\Contracts\Repositories\PoliticoRepositoryInterface;
use App\Providers\External\CamaraProvider;
use App\Providers\External\BrasilIoProvider;
use App\Providers\External\LexmlProvider;
use App\Providers\External\SenadoProvider;
use App\Providers\External\TseProvider;
use App\Providers\External\WikipediaProvider;
use App\Repositories\HealthRepository;
use App\Repositories\PostgresEmendaRepository;
use App\Repositories\PostgresGastoRepository;
use App\Repositories\PostgresPoliticoRepository;
use Illuminate\Contracts\Cache\Factory as CacheFactory;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

final class RadarServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PoliticoRepositoryInterface::class, PostgresPoliticoRepository::class);
        $this->app->bind(GastoRepositoryInterface::class, PostgresGastoRepository::class);
        $this->app->bind(EmendaRepositoryInterface::class, PostgresEmendaRepository::class);
        $this->app->bind(HealthRepositoryInterface::class, HealthRepository::class);
        $this->app->bind(CamaraProviderInterface::class, CamaraProvider::class);
        $this->app->bind(WikipediaProviderInterface::class, WikipediaProvider::class);
        $this->app->bind(SenadoProviderInterface::class, SenadoProvider::class);
        $this->app->bind(TseProviderInterface::class, TseProvider::class);
        $this->app->bind(LexmlProviderInterface::class, LexmlProvider::class);
        $this->app->bind(BrasilIoProviderInterface::class, BrasilIoProvider::class);

        $this->app->bind(CacheRepository::class, function ($app): CacheRepository {
            /** @var CacheFactory $cache */
            $cache = $app->make(CacheFactory::class);
            return $cache->store('redis');
        });
    }

    public function boot(): void
    {
        $thresholdMs = (int) config('radar.slow_query_log_ms', 200);
        if ($thresholdMs <= 0) {
            return;
        }

        DB::listen(function (QueryExecuted $query) use ($thresholdMs): void {
            if ($query->time < $thresholdMs) {
                return;
            }

            $requestId = request()?->attributes->get('request_id');
            Log::warning('slow_sql_query', [
                'request_id' => $requestId,
                'time_ms' => round($query->time, 2),
                'sql' => $query->sql,
                'bindings_count' => count($query->bindings),
                'connection' => $query->connectionName,
            ]);
        });
    }
}
