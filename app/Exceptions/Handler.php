<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * @var array<int,class-string<Throwable>>
     */
    protected $dontReport = [];

    /**
     * @var array<int,string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e): void {
            Log::error('Unhandled exception', [
                'message' => $e->getMessage(),
                'exception' => $e::class,
            ]);
        });

        $this->renderable(function (Throwable $e, Request $request) {
            if (!$request->is('graphql') && !$request->expectsJson()) {
                return null;
            }

            $requestId = (string) $request->attributes->get('request_id', '');

            return response()->json([
                'error' => (bool) config('app.debug') ? $e->getMessage() : 'internal_server_error',
                'request_id' => $requestId,
            ], 500);
        });
    }
}
