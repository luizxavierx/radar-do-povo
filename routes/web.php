<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::get('/', static fn () => response()->json([
    'name' => 'API Radar do Povo',
    'status' => 'ok',
    'graphql' => '/graphql',
    'health' => '/api/healthz',
]));
