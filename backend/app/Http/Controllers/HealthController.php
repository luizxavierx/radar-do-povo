<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\HealthService;
use Illuminate\Http\JsonResponse;

final class HealthController extends Controller
{
    public function __construct(private readonly HealthService $healthService) {}

    public function __invoke(): JsonResponse
    {
        $status = $this->healthService->status();
        $httpStatus = $status['status'] === 'ok' ? 200 : 503;

        return response()->json($status, $httpStatus);
    }
}
