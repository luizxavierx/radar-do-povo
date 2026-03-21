<?php

declare(strict_types=1);

use App\Http\Middleware\RequestIdMiddleware;
use App\Http\Middleware\RequestLoggingMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/healthz',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'request.id' => RequestIdMiddleware::class,
        ]);
        $middleware->append(RequestIdMiddleware::class);
        $middleware->append(RequestLoggingMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // O handler principal esta em app/Exceptions/Handler.php.
    })
    ->create();
