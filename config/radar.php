<?php

declare(strict_types=1);

return [
    'query_cache_ttl_seconds' => (int) env('RADAR_QUERY_CACHE_TTL_SECONDS', 300),
    'external_cache_ttl_seconds' => (int) env('RADAR_EXTERNAL_CACHE_TTL_SECONDS', 1800),
    'http_timeout_seconds' => (int) env('RADAR_HTTP_TIMEOUT_SECONDS', 1),
    'http_retry_times' => (int) env('RADAR_HTTP_RETRY_TIMES', 1),
    'http_retry_sleep_ms' => (int) env('RADAR_HTTP_RETRY_SLEEP_MS', 100),
    'max_page_size' => (int) env('RADAR_MAX_PAGE_SIZE', 20),
    'max_nested_page_size' => (int) env('RADAR_MAX_NESTED_PAGE_SIZE', 10),
    'slow_query_log_ms' => (int) env('RADAR_SLOW_QUERY_LOG_MS', 200),
    'enable_viagens_token_fallback' => (bool) env('RADAR_ENABLE_VIAGENS_TOKEN_FALLBACK', false),
];
