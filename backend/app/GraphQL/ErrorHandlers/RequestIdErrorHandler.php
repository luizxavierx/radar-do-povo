<?php

declare(strict_types=1);

namespace App\GraphQL\ErrorHandlers;

use Closure;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;
use Nuwave\Lighthouse\Execution\ErrorHandler;

final class RequestIdErrorHandler implements ErrorHandler
{
    /**
     * @param array<string,mixed>|null $result
     * @return array<string,mixed>|null
     */
    public function __invoke(?Error $error, Closure $next): ?array
    {
        $result = $next($error);
        if ($result === null) {
            return null;
        }

        $requestId = request()->attributes->get('request_id');
        if ($requestId) {
            $result['extensions']['request_id'] = $requestId;
        }

        if ($error !== null) {
            $previous = $error->getPrevious();

            Log::error('graphql_error', [
                'request_id' => $requestId,
                'message' => $error->getMessage(),
                'path' => $error->getPath(),
                'locations' => $error->getLocations(),
                'exception_class' => $previous ? $previous::class : null,
                'exception_message' => $previous?->getMessage(),
            ]);
        }

        return $result;
    }
}
