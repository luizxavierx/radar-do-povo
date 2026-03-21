<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\GastoService;

final class GastoQuery
{
    public function __construct(private readonly GastoService $gastoService) {}

    /**
     * @param array<string,mixed> $args
     */
    public function gastosPolitico(mixed $_, array $args): array
    {
        $input = $args['input'] ?? [];
        $politicoId = trim((string) ($input['politicoId'] ?? ''));
        if ($politicoId === '') {
            return $this->emptySummary([
                'anoInicio' => null,
                'anoFim' => null,
            ]);
        }

        $periodo = $this->normalizePeriodo($input['filtro'] ?? []);
        return $this->gastoService->summaryByPoliticoId($politicoId, $periodo);
    }

    /**
     * @param array<string,mixed> $input
     * @return array{anoInicio?:int|null,anoFim?:int|null}
     */
    private function normalizePeriodo(array $input): array
    {
        $from = isset($input['anoInicio']) ? (int) $input['anoInicio'] : null;
        $to = isset($input['anoFim']) ? (int) $input['anoFim'] : null;

        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [
            'anoInicio' => $from,
            'anoFim' => $to,
        ];
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    private function emptySummary(array $periodo): array
    {
        return [
            'totalViagens' => 0,
            'totalTrechos' => 0,
            'totalDiariasCents' => 0,
            'totalPassagensCents' => 0,
            'totalPagamentosCents' => 0,
            'totalOutrosGastosCents' => 0,
            'totalDevolucaoCents' => 0,
            'periodo' => $periodo,
        ];
    }
}
