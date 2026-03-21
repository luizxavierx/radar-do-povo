<?php

declare(strict_types=1);

use App\Http\Controllers\HealthController;
use App\Http\Controllers\MetricsController;
use Illuminate\Support\Facades\Route;

Route::get('/healthz', HealthController::class);
Route::get('/metrics', MetricsController::class);
