<?php

declare(strict_types=1);

return [
    'name' => env('APP_NAME', 'API Radar do Povo'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost:8081'),
    'timezone' => env('APP_TIMEZONE', 'America/Sao_Paulo'),
    'locale' => env('APP_LOCALE', 'pt_BR'),
    'fallback_locale' => 'pt_BR',
    'faker_locale' => 'pt_BR',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
];
