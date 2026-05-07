<?php

declare(strict_types=1);

namespace App\GraphQL\Support;

use App\Cache\CacheKeyFactory;
use App\Services\GastoService;
use Illuminate\Http\Request;

final class ExpenseLoaderRegistry
{
    public function __construct(
        private readonly Request $request,
        private readonly GastoService $gastoService,
    ) {}

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public function forPeriodo(array $periodo): ExpenseBatchLoader
    {
        $key = CacheKeyFactory::expenseLoader($periodo);
        $loader = $this->request->attributes->get($key);

        if ($loader instanceof ExpenseBatchLoader) {
            return $loader;
        }

        $loader = new ExpenseBatchLoader($this->gastoService, $periodo);
        $this->request->attributes->set($key, $loader);

        return $loader;
    }
}
