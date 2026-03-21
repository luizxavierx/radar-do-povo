<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class RequestLoggingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $durationMs = (microtime(true) - $start) * 1000;
        Log::info('http_request', [
            'request_id' => $request->attributes->get('request_id'),
            'method' => $request->getMethod(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($durationMs, 2),
            'ip' => $request->ip(),
        ]);

        return $response;
    }
}
