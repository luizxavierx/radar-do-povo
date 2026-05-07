<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait ParsesRestQueryParameters
{
    private function stringQuery(Request $request, string $key): ?string
    {
        $value = $request->query($key);
        if (is_array($value)) {
            return null;
        }

        $normalized = trim((string) $value);
        return $normalized !== '' ? $normalized : null;
    }

    private function intQuery(Request $request, string $key): ?int
    {
        $value = $request->query($key);
        if ($value === null || $value === '' || is_array($value)) {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    private function boolQuery(Request $request, string $key): ?bool
    {
        if (!$request->query->has($key)) {
            return null;
        }

        $value = $request->query($key);
        if (is_bool($value)) {
            return $value;
        }

        if (is_array($value)) {
            return null;
        }

        $normalized = mb_strtolower(trim((string) $value), 'UTF-8');
        return match ($normalized) {
            '1', 'true', 'yes', 'on' => true,
            '0', 'false', 'no', 'off' => false,
            default => null,
        };
    }

    /**
     * @return array{limit:int,offset:int}
     */
    private function paginationQuery(Request $request, int $defaultLimit = 20, string $configKey = 'radar.max_page_size'): array
    {
        $limit = $this->intQuery($request, 'limit') ?? $defaultLimit;
        $offset = $this->intQuery($request, 'offset') ?? 0;
        $maxPageSize = (int) config($configKey, $defaultLimit);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @return array{limit:int,offset:int}
     */
    private function nestedPaginationQuery(
        Request $request,
        string $prefix,
        int $defaultLimit = 10,
        string $configKey = 'radar.max_nested_page_size',
    ): array {
        $limit = $this->intQuery($request, "{$prefix}Limit")
            ?? $this->intQuery($request, 'nestedLimit')
            ?? $defaultLimit;
        $offset = $this->intQuery($request, "{$prefix}Offset")
            ?? $this->intQuery($request, 'nestedOffset')
            ?? 0;
        $maxPageSize = (int) config($configKey, $defaultLimit);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @param array{nodes: array<int,array<string,mixed>>, total:int} $result
     * @param array{limit:int,offset:int} $pagination
     * @return array{nodes: array<int,array<string,mixed>>, total:int, limit:int, offset:int}
     */
    private function connectionPayload(array $result, array $pagination): array
    {
        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    private function notFound(Request $request, string $message): JsonResponse
    {
        return response()->json([
            'error' => $message,
            'request_id' => (string) $request->attributes->get('request_id', ''),
        ], 404);
    }

    private function camelize(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn (mixed $item): mixed => $this->camelize($item), $value);
        }

        $normalized = [];
        foreach ($value as $key => $item) {
            $normalized[$this->camelizeKey((string) $key)] = $this->camelize($item);
        }

        return $normalized;
    }

    private function camelizeKey(string $key): string
    {
        if (!str_contains($key, '_')) {
            return $key;
        }

        $segments = explode('_', $key);
        $first = array_shift($segments);
        if ($first === null) {
            return $key;
        }

        $tail = array_map(
            static fn (string $segment): string => $segment !== '' ? ucfirst($segment) : '',
            $segments,
        );

        return $first . implode('', $tail);
    }
}
