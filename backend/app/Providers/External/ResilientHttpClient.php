<?php

declare(strict_types=1);

namespace App\Providers\External;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

final class ResilientHttpClient
{
    public function make(): PendingRequest
    {
        $timeoutSeconds = (int) config('radar.http_timeout_seconds', 2);
        $retryTimes = (int) config('radar.http_retry_times', 2);
        $retrySleep = (int) config('radar.http_retry_sleep_ms', 200);

        return Http::acceptJson()
            ->timeout(max(1, $timeoutSeconds))
            ->retry(max(0, $retryTimes), max(1, $retrySleep), throw: false);
    }
}
