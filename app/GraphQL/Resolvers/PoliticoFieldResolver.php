<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\GraphQL\Support\ExpenseLoaderRegistry;
use App\Services\EmendaService;
use App\Services\GastoService;
use App\Services\PoliticoService;
use GraphQL\Deferred;
use GraphQL\Type\Definition\ResolveInfo;

final class PoliticoFieldResolver
{
    public function __construct(
        private readonly ExpenseLoaderRegistry $loaderRegistry,
        private readonly PoliticoService $politicoService,
        private readonly GastoService $gastoService,
        private readonly EmendaService $emendaService,
    ) {}

    /**
     * @param array<string,mixed> $politico
     * @param array<string,mixed> $args
     */
    public function gastos(array $politico, array $args): Deferred|array
    {
        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return $this->emptySummary([
                'anoInicio' => null,
                'anoFim' => null,
            ]);
        }

        $periodo = $this->normalizePeriodo($args['filtro'] ?? []);
        $loader = $this->loaderRegistry->forPeriodo($periodo);

        return $loader->load($politicoId);
    }

    /**
     * @param array<string,mixed> $politico
     * @return array<string,mixed>
     */
    public function perfilExterno(array $politico, array $args, mixed $context, ResolveInfo $resolveInfo): array
    {
        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return $this->emptyExternalProfile();
        }

        return $this->politicoService->externalProfileByPoliticoId(
            $politicoId,
            $this->requestedExternalSources($resolveInfo),
        );
    }

    /**
     * @param array<string,mixed> $politico
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function viagens(array $politico, array $args): array
    {
        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $periodo = $this->normalizePeriodoFromArgs($args);
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->listViagensByPoliticoId(
            $politicoId,
            $periodo,
            $pagination['limit'],
            $pagination['offset'],
        );

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $politico
     * @param array<string,mixed> $args
     * @return array<string,mixed>
     */
    public function emendasResumo(array $politico, array $args): array
    {
        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return $this->emptyEmendaResumo([
                'anoInicio' => null,
                'anoFim' => null,
                'uf' => null,
                'tipoEmenda' => null,
                'pais' => null,
                'apenasParlamentares' => null,
                'cargoParlamentar' => null,
            ]);
        }

        $filtro = $this->normalizeEmendaFiltro($args['filtro'] ?? []);
        return $this->emendaService->summaryByPoliticoId($politicoId, $filtro);
    }

    /**
     * @param array<string,mixed> $politico
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function emendas(array $politico, array $args): array
    {
        $politicoId = trim((string) ($politico['id'] ?? ''));
        if ($politicoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $filtro = $this->normalizeEmendaFiltro($args['filtro'] ?? []);
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->emendaService->listByPoliticoId(
            $politicoId,
            $filtro,
            $pagination['limit'],
            $pagination['offset'],
        );

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
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
     * @param array<string,mixed> $args
     * @return array{anoInicio:?int,anoFim:?int}
     */
    private function normalizePeriodoFromArgs(array $args): array
    {
        $from = isset($args['anoInicio']) ? (int) $args['anoInicio'] : null;
        $to = isset($args['anoFim']) ? (int) $args['anoFim'] : null;
        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [
            'anoInicio' => $from,
            'anoFim' => $to,
        ];
    }

    /**
     * @param array<string,mixed> $input
     * @return array{limit:int,offset:int}
     */
    private function normalizePagination(array $input): array
    {
        $limit = isset($input['limit']) ? (int) $input['limit'] : 20;
        $offset = isset($input['offset']) ? (int) $input['offset'] : 0;
        $maxPageSize = (int) config('radar.max_page_size', 20);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @param array<string,mixed> $input
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function normalizeEmendaFiltro(array $input): array
    {
        $from = isset($input['anoInicio']) ? (int) $input['anoInicio'] : null;
        $to = isset($input['anoFim']) ? (int) $input['anoFim'] : null;
        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        $uf = isset($input['uf']) ? trim((string) $input['uf']) : null;
        $tipo = isset($input['tipoEmenda']) ? trim((string) $input['tipoEmenda']) : null;
        $pais = isset($input['pais']) ? trim((string) $input['pais']) : null;
        $apenasParlamentares = array_key_exists('apenasParlamentares', $input)
            ? (bool) $input['apenasParlamentares']
            : null;
        $cargoParlamentar = isset($input['cargoParlamentar'])
            ? mb_strtoupper(trim((string) $input['cargoParlamentar']), 'UTF-8')
            : null;

        if ($cargoParlamentar !== 'DEPUTADO' && $cargoParlamentar !== 'SENADOR') {
            $cargoParlamentar = null;
        }

        return [
            'anoInicio' => $from,
            'anoFim' => $to,
            'uf' => $uf !== '' ? $uf : null,
            'tipoEmenda' => $tipo !== '' ? $tipo : null,
            'pais' => $pais !== null && $pais !== '' ? mb_strtoupper($pais, 'UTF-8') : null,
            'apenasParlamentares' => $apenasParlamentares,
            'cargoParlamentar' => $cargoParlamentar,
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

    /**
     * @param array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string} $filtro
     * @return array<string,mixed>
     */
    private function emptyEmendaResumo(array $filtro): array
    {
        return [
            'totalEmendas' => 0,
            'totalEmpenhadoCents' => 0,
            'totalLiquidadoCents' => 0,
            'totalPagoCents' => 0,
            'totalRpInscritosCents' => 0,
            'totalRpCanceladosCents' => 0,
            'totalRpPagosCents' => 0,
            'totalRecebidoFavorecidosCents' => 0,
            'totalFavorecidos' => 0,
            'periodo' => [
                'anoInicio' => $filtro['anoInicio'],
                'anoFim' => $filtro['anoFim'],
            ],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function emptyExternalProfile(): array
    {
        $portalBase = rtrim((string) config('services.tse.portal_base_url', 'https://dadosabertos.tse.jus.br'), '/');
        $cdnBase = rtrim((string) config('services.tse.candidatos_cdn_base_url', 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand'), '/');
        $divulgaBase = rtrim((string) config('services.tse.divulgacandcontas_url', 'https://divulgacandcontas.tse.jus.br'), '/');

        return [
            'camara' => [
                'id' => null,
                'nome' => null,
                'siglaPartido' => null,
                'siglaUf' => null,
                'urlFoto' => null,
                'email' => null,
                'uri' => null,
                'fonte' => 'camara_dados_abertos',
            ],
            'wikipedia' => [
                'titulo' => null,
                'resumo' => null,
                'url' => null,
                'fonte' => 'wikipedia_rest_api',
            ],
            'senado' => [
                'codigo' => null,
                'nome' => null,
                'nomeCompleto' => null,
                'siglaPartido' => null,
                'uf' => null,
                'email' => null,
                'urlFoto' => null,
                'urlPagina' => null,
                'afastadoAtual' => null,
                'fonte' => 'senado_dados_abertos',
            ],
            'tse' => [
                'termoBusca' => null,
                'datasetCandidatosUrl' => $portalBase . '/dataset/candidatos',
                'datasetResultadosUrl' => $portalBase . '/dataset/resultados-2022',
                'candidatosCdnBaseUrl' => $cdnBase,
                'divulgaCandContasUrl' => $divulgaBase,
                'fonte' => 'tse_dados_abertos',
            ],
            'lexml' => [
                'total' => 0,
                'documentos' => [],
            ],
            'brasilIo' => [
                'total' => 0,
                'candidatos' => [],
            ],
        ];
    }

    /**
     * @return array<int,string>
     */
    private function requestedExternalSources(ResolveInfo $resolveInfo): array
    {
        $selection = $resolveInfo->getFieldSelection(2);
        if ($selection === []) {
            return [];
        }

        $allowed = ['camara', 'wikipedia', 'senado', 'tse', 'lexml', 'brasilIo'];
        $requested = [];
        foreach ($allowed as $source) {
            if (array_key_exists($source, $selection)) {
                $requested[] = $source;
            }
        }

        return $requested;
    }
}
