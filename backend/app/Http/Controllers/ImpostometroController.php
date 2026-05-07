<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ImpostometroUnavailableException;
use App\Http\Controllers\Concerns\ParsesRestQueryParameters;
use App\Services\ImpostometroService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ImpostometroController extends Controller
{
    use ParsesRestQueryParameters;

    public function __construct(private readonly ImpostometroService $impostometroService) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            return response()->json($this->camelize($this->impostometroService->resumo()));
        } catch (ImpostometroUnavailableException $exception) {
            return response()->json([
                'error' => $exception->getMessage(),
                'request_id' => (string) $request->attributes->get('request_id', ''),
            ], $exception->statusCode);
        }
    }
}
