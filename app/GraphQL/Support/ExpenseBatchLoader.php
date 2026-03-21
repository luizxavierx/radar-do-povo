<?php

declare(strict_types=1);

namespace App\GraphQL\Support;

use App\Services\GastoService;
use GraphQL\Deferred;

final class ExpenseBatchLoader
{
    /**
     * @var array<int,string>
     */
    private array $queuedIds = [];

    /**
     * @var array<string,array<string,mixed>>
     */
    private array $resolved = [];

    private bool $isResolved = false;

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public function __construct(
        private readonly GastoService $gastoService,
        private readonly array $periodo,
    ) {}

    public function load(string $politicoId): Deferred
    {
        $this->queuedIds[$politicoId] = $politicoId;

        return new Deferred(function () use ($politicoId): array {
            if (!$this->isResolved) {
                $this->resolve();
            }

            return $this->resolved[$politicoId] ?? $this->emptySummary();
        });
    }

    private function resolve(): void
    {
        $ids = array_values($this->queuedIds);
        if ($ids === []) {
            $this->isResolved = true;
            return;
        }

        $this->resolved = $this->gastoService->batchSummaryByPoliticoIds($ids, $this->periodo);
        $this->isResolved = true;
    }

    private function emptySummary(): array
    {
        return [
            'totalViagens' => 0,
            'totalTrechos' => 0,
            'totalDiariasCents' => 0,
            'totalPassagensCents' => 0,
            'totalPagamentosCents' => 0,
            'totalOutrosGastosCents' => 0,
            'totalDevolucaoCents' => 0,
            'periodo' => [
                'anoInicio' => $this->periodo['anoInicio'] ?? null,
                'anoFim' => $this->periodo['anoFim'] ?? null,
            ],
        ];
    }
}
