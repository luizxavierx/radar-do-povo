<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ParsesRestQueryParameters;
use App\Services\NewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NewsRestController extends Controller
{
    use ParsesRestQueryParameters;

    public function __construct(private readonly NewsService $newsService) {}

    public function index(Request $request): JsonResponse
    {
        $politico = $this->stringQuery($request, 'politico');
        if ($politico === null) {
            return response()->json([
                'error' => 'parametro_politico_obrigatorio',
                'request_id' => (string) $request->attributes->get('request_id', ''),
            ], 422);
        }

        $limit = $this->intQuery($request, 'limit') ?? (int) config('news.max_items', 12);
        $limit = max(1, min($limit, max(1, (int) config('news.max_items', 12))));

        return response()->json($this->camelize(
            $this->newsService->latestByPolitico($politico, $limit),
        ));
    }
}
