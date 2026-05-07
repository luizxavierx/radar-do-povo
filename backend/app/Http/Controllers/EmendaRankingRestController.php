<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ParsesRestQueryParameters;
use App\Services\EmendaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class EmendaRankingRestController extends Controller
{
    use ParsesRestQueryParameters;

    public function __construct(private readonly EmendaService $emendaService) {}

    public function resumo(Request $request): JsonResponse
    {
        $filtro = $this->normalizeFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }

        return response()->json($this->camelize(
            $this->emendaService->rankingSummary($filtro),
        ));
    }

    public function serieAnual(Request $request): JsonResponse
    {
        $filtro = $this->normalizeFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }

        $result = $this->emendaService->annualSeries($filtro);
        $pagination = [
            'limit' => count($result['nodes']),
            'offset' => 0,
        ];

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function topTipos(Request $request): JsonResponse
    {
        $filtro = $this->normalizeFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }

        $pagination = $this->paginationQuery($request, 8, 'radar.max_ranking_page_size');
        $result = $this->emendaService->topTipos($filtro, $pagination['limit'], $pagination['offset']);

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function topGastadores(Request $request): JsonResponse
    {
        $filtro = $this->normalizeFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }

        $pagination = $this->paginationQuery($request, 20, 'radar.max_ranking_page_size');
        $result = $this->emendaService->topGastadores($filtro, $pagination['limit'], $pagination['offset']);

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    public function topPaises(Request $request): JsonResponse
    {
        $filtro = $this->normalizeFiltro($request);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }

        $pagination = $this->paginationQuery($request, 20, 'radar.max_ranking_page_size');
        $result = $this->emendaService->topPorPais($filtro, $pagination['limit'], $pagination['offset']);

        return response()->json($this->camelize($this->connectionPayload($result, $pagination)));
    }

    /**
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function normalizeFiltro(Request $request): array
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

        $pais = $this->stringQuery($request, 'pais');

        return [
            'anoInicio' => $anoInicio,
            'anoFim' => $anoFim,
            'uf' => $this->stringQuery($request, 'uf'),
            'tipoEmenda' => $this->stringQuery($request, 'tipoEmenda'),
            'pais' => $pais !== null ? mb_strtoupper($pais, 'UTF-8') : null,
            'apenasParlamentares' => $this->boolQuery($request, 'apenasParlamentares'),
            'cargoParlamentar' => $cargoParlamentar,
        ];
    }
}
