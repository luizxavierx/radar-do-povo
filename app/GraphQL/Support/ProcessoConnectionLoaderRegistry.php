<?php

declare(strict_types=1);

namespace App\GraphQL\Support;

use App\Services\GastoService;
use Illuminate\Http\Request;

final class ProcessoConnectionLoaderRegistry
{
    public function __construct(
        private readonly Request $request,
        private readonly GastoService $gastoService,
    ) {}

    public function passagens(int $limit, int $offset): ProcessoConnectionBatchLoader
    {
        $key = "processo_loader:passagens:{$limit}:{$offset}";
        $loader = $this->request->attributes->get($key);
        if ($loader instanceof ProcessoConnectionBatchLoader) {
            return $loader;
        }

        $loader = new ProcessoConnectionBatchLoader(
            fn (array $processoIds): array => $this->gastoService->batchPassagensByProcessoIds(
                $processoIds,
                $limit,
                $offset,
            ),
        );

        $this->request->attributes->set($key, $loader);
        return $loader;
    }

    public function pagamentos(int $limit, int $offset): ProcessoConnectionBatchLoader
    {
        $key = "processo_loader:pagamentos:{$limit}:{$offset}";
        $loader = $this->request->attributes->get($key);
        if ($loader instanceof ProcessoConnectionBatchLoader) {
            return $loader;
        }

        $loader = new ProcessoConnectionBatchLoader(
            fn (array $processoIds): array => $this->gastoService->batchPagamentosByProcessoIds(
                $processoIds,
                $limit,
                $offset,
            ),
        );

        $this->request->attributes->set($key, $loader);
        return $loader;
    }

    public function trechos(int $limit, int $offset): ProcessoConnectionBatchLoader
    {
        $key = "processo_loader:trechos:{$limit}:{$offset}";
        $loader = $this->request->attributes->get($key);
        if ($loader instanceof ProcessoConnectionBatchLoader) {
            return $loader;
        }

        $loader = new ProcessoConnectionBatchLoader(
            fn (array $processoIds): array => $this->gastoService->batchTrechosByProcessoIds(
                $processoIds,
                $limit,
                $offset,
            ),
        );

        $this->request->attributes->set($key, $loader);
        return $loader;
    }
}

