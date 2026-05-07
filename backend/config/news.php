<?php

declare(strict_types=1);

return [
    'cache_ttl_seconds' => (int) env('RADAR_NEWS_CACHE_TTL_SECONDS', 900),
    'http_timeout_seconds' => (int) env('RADAR_NEWS_HTTP_TIMEOUT_SECONDS', 6),
    'http_retry_times' => (int) env('RADAR_NEWS_HTTP_RETRY_TIMES', 1),
    'http_retry_sleep_ms' => (int) env('RADAR_NEWS_HTTP_RETRY_SLEEP_MS', 150),
    'max_items' => (int) env('RADAR_NEWS_MAX_ITEMS', 12),
    'feeds' => [
        [
            'key' => 'g1_politica',
            'label' => 'g1 Politica',
            'url' => 'https://g1.globo.com/rss/g1/politica/',
        ],
        [
            'key' => 'agencia_brasil_politica',
            'label' => 'Agencia Brasil',
            'url' => 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml',
        ],
        [
            'key' => 'folha_poder',
            'label' => 'Folha Poder',
            'url' => 'https://feeds.folha.uol.com.br/poder/rss091.xml',
        ],
        [
            'key' => 'carta_capital_politica',
            'label' => 'CartaCapital',
            'url' => 'https://www.cartacapital.com.br/politica/feed/',
        ],
    ],
];
