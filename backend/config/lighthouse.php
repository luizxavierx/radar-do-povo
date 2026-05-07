<?php

declare(strict_types=1);

return [
    'route' => [
        'uri' => '/graphql',
        'name' => 'graphql',
        'middleware' => [
            'api',
        ],
    ],

    'schema_path' => base_path('graphql/schema.graphql'),

    'guard' => null,

    'security' => [
        'max_query_complexity' => (int) env('GRAPHQL_MAX_COMPLEXITY', 220),
        'max_query_depth' => (int) env('GRAPHQL_MAX_DEPTH', 12),
    ],

    'error_handlers' => [
        Nuwave\Lighthouse\Execution\AuthenticationErrorHandler::class,
        Nuwave\Lighthouse\Execution\AuthorizationErrorHandler::class,
        Nuwave\Lighthouse\Execution\ValidationErrorHandler::class,
        App\GraphQL\ErrorHandlers\RequestIdErrorHandler::class,
    ],
];
