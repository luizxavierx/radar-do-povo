<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ParsesRestQueryParameters;
use App\Services\EmendaService;
use App\Services\GastoService;
use App\Services\PoliticoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PoliticoDossieRestController extends Controller
{
    use ParsesRestQueryParameters;

    public function __construct(
        private readonly PoliticoService $politicoService,
        private readonly GastoService $gastoService,
        private readonly EmendaService $emendaService,
    ) {}

    public function show(Request $request, string $idOrNome): JsonResponse
    {
        $politico = $this->resolvePolitico($idOrNome);
        if (!is_array($politico)) {
            return $this->notFound($request, 'politico_nao_encontrado');
        }

        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return $this->notFound($request, 'politico_nao_encontrado');
        }

        $periodo = $this->periodo($request);
        $viagensPagination = $this->politicoPaginationQuery($request, 'viagens', 50);
        $emendasPagination = $this->politicoPaginationQuery($request, 'emendas', 50);
        $passagensPagination = $this->nestedPaginationQuery($request, 'passagens', 30);
        $pagamentosPagination = $this->nestedPaginationQuery($request, 'pagamentos', 30);
        $trechosPagination = $this->nestedPaginationQuery($request, 'trechos', 30);
        $conveniosPagination = $this->nestedPaginationQuery($request, 'convenios', 30);
        $favorecidosPagination = $this->nestedPaginationQuery($request, 'favorecidos', 30);

        $viagens = $this->gastoService->listViagensByPoliticoId(
            $politicoId,
            $periodo,
            $viagensPagination['limit'],
            $viagensPagination['offset'],
        );
        $emendas = $this->emendaService->listByPoliticoId(
            $politicoId,
            $this->emendaFiltro($periodo),
            $emendasPagination['limit'],
            $emendasPagination['offset'],
        );

        $politico['perfil_externo'] = $this->politicoService->externalProfileByPoliticoId($politicoId);
        $politico['gastos'] = $this->gastoService->summaryByPoliticoId($politicoId, $periodo);
        $politico['viagens'] = $this->connectionPayload(
            $this->hydrateViagens($viagens, $passagensPagination, $pagamentosPagination, $trechosPagination),
            $viagensPagination,
        );
        $politico['emendas'] = $this->connectionPayload(
            $this->hydrateEmendas($emendas, $conveniosPagination, $favorecidosPagination),
            $emendasPagination,
        );

        return response()->json($this->camelize($politico));
    }

    private function resolvePolitico(string $idOrNome): ?array
    {
        $candidate = trim(urldecode($idOrNome));
        if ($candidate === '') {
            return null;
        }

        return $this->politicoService->findById($candidate)
            ?? $this->politicoService->findByNomeCanonico($candidate);
    }

    /**
     * @return array{anoInicio:?int,anoFim:?int}
     */
    private function periodo(Request $request): array
    {
        $anoInicio = $this->intQuery($request, 'anoInicio');
        $anoFim = $this->intQuery($request, 'anoFim');

        if ($anoInicio !== null && $anoFim !== null && $anoInicio > $anoFim) {
            [$anoInicio, $anoFim] = [$anoFim, $anoInicio];
        }

        return [
            'anoInicio' => $anoInicio,
            'anoFim' => $anoFim,
        ];
    }

    /**
     * @return array{limit:int,offset:int}
     */
    private function politicoPaginationQuery(Request $request, string $prefix, int $defaultLimit): array
    {
        $limit = $this->intQuery($request, "{$prefix}Limit") ?? $defaultLimit;
        $offset = $this->intQuery($request, "{$prefix}Offset") ?? 0;
        $maxPageSize = (int) config('radar.max_page_size', $defaultLimit);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @param array{anoInicio:?int,anoFim:?int} $periodo
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function emendaFiltro(array $periodo): array
    {
        return [
            'anoInicio' => $periodo['anoInicio'],
            'anoFim' => $periodo['anoFim'],
            'uf' => null,
            'tipoEmenda' => null,
            'pais' => null,
            'apenasParlamentares' => null,
            'cargoParlamentar' => null,
        ];
    }

    /**
     * @param array{nodes: array<int,array<string,mixed>>, total:int} $viagens
     * @param array{limit:int,offset:int} $passagensPagination
     * @param array{limit:int,offset:int} $pagamentosPagination
     * @param array{limit:int,offset:int} $trechosPagination
     * @return array{nodes: array<int,array<string,mixed>>, total:int}
     */
    private function hydrateViagens(
        array $viagens,
        array $passagensPagination,
        array $pagamentosPagination,
        array $trechosPagination,
    ): array {
        $nodes = $viagens['nodes'];
        $processoIds = array_values(array_filter(array_map(
            static fn (array $node): string => trim((string) ($node['processo_id'] ?? '')),
            $nodes,
        )));

        $passagens = $this->gastoService->batchPassagensByProcessoIds(
            $processoIds,
            $passagensPagination['limit'],
            $passagensPagination['offset'],
        );
        $pagamentos = $this->gastoService->batchPagamentosByProcessoIds(
            $processoIds,
            $pagamentosPagination['limit'],
            $pagamentosPagination['offset'],
        );
        $trechos = $this->gastoService->batchTrechosByProcessoIds(
            $processoIds,
            $trechosPagination['limit'],
            $trechosPagination['offset'],
        );

        foreach ($nodes as &$node) {
            $processoId = trim((string) ($node['processo_id'] ?? ''));
            $node['passagens'] = $this->connectionPayload(
                $passagens[$processoId] ?? ['nodes' => [], 'total' => 0],
                $passagensPagination,
            );
            $node['pagamentos'] = $this->connectionPayload(
                $pagamentos[$processoId] ?? ['nodes' => [], 'total' => 0],
                $pagamentosPagination,
            );
            $node['trechos'] = $this->connectionPayload(
                $trechos[$processoId] ?? ['nodes' => [], 'total' => 0],
                $trechosPagination,
            );
        }
        unset($node);

        return [
            'nodes' => $nodes,
            'total' => (int) ($viagens['total'] ?? 0),
        ];
    }

    /**
     * @param array{nodes: array<int,array<string,mixed>>, total:int} $emendas
     * @param array{limit:int,offset:int} $conveniosPagination
     * @param array{limit:int,offset:int} $favorecidosPagination
     * @return array{nodes: array<int,array<string,mixed>>, total:int}
     */
    private function hydrateEmendas(
        array $emendas,
        array $conveniosPagination,
        array $favorecidosPagination,
    ): array {
        $nodes = $emendas['nodes'];

        foreach ($nodes as &$node) {
            $codigoEmenda = trim((string) ($node['codigo_emenda'] ?? ''));
            $node['convenios'] = $this->connectionPayload(
                $this->emendaService->listConveniosByCodigoEmenda(
                    $codigoEmenda,
                    $conveniosPagination['limit'],
                    $conveniosPagination['offset'],
                ),
                $conveniosPagination,
            );
            $node['favorecidos'] = $this->connectionPayload(
                $this->emendaService->listFavorecidosByCodigoEmenda(
                    $codigoEmenda,
                    $favorecidosPagination['limit'],
                    $favorecidosPagination['offset'],
                ),
                $favorecidosPagination,
            );
        }
        unset($node);

        return [
            'nodes' => $nodes,
            'total' => (int) ($emendas['total'] ?? 0),
        ];
    }
}
