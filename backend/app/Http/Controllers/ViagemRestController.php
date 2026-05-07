<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ParsesRestQueryParameters;
use App\Services\GastoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ViagemRestController extends Controller
{
    use ParsesRestQueryParameters;

    public function __construct(private readonly GastoService $gastoService) {}

    public function resumo(Request $request): JsonResponse
    {
        $filtro = $this->normalizeRankingFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }

        return response()->json($this->camelize($this->gastoService->summaryViagens(
            $filtro,
            $this->includePagamentos($request),
            $this->includeTrechos($request),
        )));
    }

    public function index(Request $request): JsonResponse
    {
        $filtro = $this->normalizeRankingFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }

        $pagination = $this->paginationQuery($request, 20);
        $result = $this->gastoService->listViagens(
            $filtro,
            $pagination['limit'],
            $pagination['offset'],
            $this->includeTotal($request),
        );

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function topViajantes(Request $request): JsonResponse
    {
        return $this->viagemPessoaRanking($request, 'topViajantes');
    }

    public function topGastadores(Request $request): JsonResponse
    {
        return $this->viagemPessoaRanking($request, 'topGastadoresViagens');
    }

    public function topOrgaosSuperiores(Request $request): JsonResponse
    {
        return $this->viagemOrgaoRanking($request, 'topOrgaosSuperioresViagens');
    }

    public function topOrgaosSolicitantes(Request $request): JsonResponse
    {
        return $this->viagemOrgaoRanking($request, 'topOrgaosSolicitantesViagens');
    }

    public function show(Request $request, string $processoId): JsonResponse
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return $this->notFound($request, 'viagem_nao_encontrada');
        }

        $base = $this->gastoService->listViagens([
            'processoId' => $processoId,
            'apenasParlamentares' => false,
        ], 1, 0, false);
        $viagem = $base['nodes'][0] ?? null;

        if (!is_array($viagem)) {
            return $this->notFound($request, 'viagem_nao_encontrada');
        }

        $passagensPagination = $this->nestedPaginationQuery($request, 'passagens');
        $pagamentosPagination = $this->nestedPaginationQuery($request, 'pagamentos');
        $trechosPagination = $this->nestedPaginationQuery($request, 'trechos');

        $viagem['passagens'] = $this->connectionPayload(
            $this->gastoService->listPassagensByProcessoId(
                $processoId,
                $passagensPagination['limit'],
                $passagensPagination['offset'],
            ),
            $passagensPagination,
        );
        $viagem['pagamentos'] = $this->connectionPayload(
            $this->gastoService->listPagamentosByProcessoId(
                $processoId,
                $pagamentosPagination['limit'],
                $pagamentosPagination['offset'],
            ),
            $pagamentosPagination,
        );
        $viagem['trechos'] = $this->connectionPayload(
            $this->gastoService->listTrechosByProcessoId(
                $processoId,
                $trechosPagination['limit'],
                $trechosPagination['offset'],
            ),
            $trechosPagination,
        );

        return response()->json($this->camelize(['viagem' => $viagem]));
    }

    public function passagens(Request $request, string $processoId): JsonResponse
    {
        $pagination = $this->nestedPaginationQuery($request, 'passagens');
        $result = $this->gastoService->listPassagensByProcessoId($processoId, $pagination['limit'], $pagination['offset']);
        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function pagamentos(Request $request, string $processoId): JsonResponse
    {
        $pagination = $this->nestedPaginationQuery($request, 'pagamentos');
        $result = $this->gastoService->listPagamentosByProcessoId($processoId, $pagination['limit'], $pagination['offset']);
        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function trechos(Request $request, string $processoId): JsonResponse
    {
        $pagination = $this->nestedPaginationQuery($request, 'trechos');
        $result = $this->gastoService->listTrechosByProcessoId($processoId, $pagination['limit'], $pagination['offset']);
        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    /**
     * @return array<string,mixed>
     */
    private function normalizeRankingFiltro(Request $request): array
    {
        $anoInicio = $this->intQuery($request, 'anoInicio');
        $anoFim = $this->intQuery($request, 'anoFim');
        if ($anoInicio !== null && $anoFim !== null && $anoInicio > $anoFim) {
            [$anoInicio, $anoFim] = [$anoFim, $anoInicio];
        }

        $cargoParlamentar = $this->stringQuery($request, 'cargoParlamentar');
        if ($cargoParlamentar !== null) {
            $cargoParlamentar = mb_strtoupper($cargoParlamentar, 'UTF-8');
        }

        if ($cargoParlamentar !== 'DEPUTADO' && $cargoParlamentar !== 'SENADOR') {
            $cargoParlamentar = null;
        }

        return [
            'anoInicio' => $anoInicio,
            'anoFim' => $anoFim,
            'orgaoSuperiorCodigo' => $this->stringQuery($request, 'orgaoSuperiorCodigo'),
            'orgaoSolicitanteCodigo' => $this->stringQuery($request, 'orgaoSolicitanteCodigo'),
            'apenasParlamentares' => $this->boolQuery($request, 'apenasParlamentares'),
            'cargoParlamentar' => $cargoParlamentar,
            'search' => $this->stringQuery($request, 'search'),
            'situacao' => $this->stringQuery($request, 'situacao'),
            'processoId' => $this->stringQuery($request, 'processoId'),
            'pcdp' => $this->stringQuery($request, 'pcdp'),
            'cpfViajante' => $this->stringQuery($request, 'cpfViajante'),
            'nomeViajante' => $this->stringQuery($request, 'nomeViajante'),
            'cargo' => $this->stringQuery($request, 'cargo'),
            'funcao' => $this->stringQuery($request, 'funcao'),
            'destino' => $this->stringQuery($request, 'destino'),
            'motivo' => $this->stringQuery($request, 'motivo'),
        ];
    }

    private function includeTotal(Request $request): bool
    {
        return $this->boolQuery($request, 'includeTotal') ?? false;
    }

    private function includePagamentos(Request $request): bool
    {
        return $this->boolQuery($request, 'includePagamentos') ?? true;
    }

    private function includeTrechos(Request $request): bool
    {
        return $this->boolQuery($request, 'includeTrechos') ?? true;
    }

    private function viagemPessoaRanking(Request $request, string $method): JsonResponse
    {
        $filtro = $this->normalizeRankingFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }

        $pagination = $this->paginationQuery($request, 5, 'radar.max_ranking_page_size');
        $nodeFields = [
            'nomeViajante',
            'cargo',
            'funcao',
            'totalViagens',
            'totalGastoLiquidoCents',
        ];

        $result = $this->gastoService->{$method}(
            $filtro,
            $pagination['limit'],
            $pagination['offset'],
            $this->includeTotal($request),
            $nodeFields,
        );

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    private function viagemOrgaoRanking(Request $request, string $method): JsonResponse
    {
        $filtro = $this->normalizeRankingFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }

        $pagination = $this->paginationQuery($request, 5, 'radar.max_ranking_page_size');
        $nodeFields = [
            'codigoOrgao',
            'nomeOrgao',
            'totalViagens',
            'totalGastoLiquidoCents',
        ];

        $result = $this->gastoService->{$method}(
            $filtro,
            $pagination['limit'],
            $pagination['offset'],
            $this->includeTotal($request),
            $nodeFields,
        );

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }
}
