<?php

declare(strict_types=1);

return [
    'paths' => ['api/*', 'graphql'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['X-Request-ID'],
    'max_age' => 0,
    'supports_credentials' => false,
];
