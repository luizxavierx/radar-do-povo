<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\GastoService;

final class ViagemQuery
{
    public function __construct(private readonly GastoService $gastoService) {}

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function viagensPolitico(mixed $_, array $args): array
    {
        $input = $args['input'] ?? [];
        $paginationInput = $args['pagination'] ?? [];

        $politicoId = trim((string) ($input['politicoId'] ?? ''));
        if ($politicoId === '') {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 20,
                'offset' => 0,
            ];
        }

        $periodo = $this->normalizePeriodo($input);
        $limit = isset($paginationInput['limit']) ? (int) $paginationInput['limit'] : 20;
        $offset = isset($paginationInput['offset']) ? (int) $paginationInput['offset'] : 0;
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $result = $this->gastoService->listViagensByPoliticoId($politicoId, $periodo, $limit, $offset);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array<string,mixed>
     */
    public function resumoViagens(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        return $this->gastoService->summaryViagens($filtro);
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function viagensPainel(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->listViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topViajantes(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topViajantes($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topOrgaosSuperioresViagens(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topOrgaosSuperioresViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topOrgaosSolicitantesViagens(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topOrgaosSolicitantesViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topGastadoresViagens(mixed $_, array $args): array
    {
        $filtro = $this->normalizeRankingFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = false;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topGastadoresViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topViajantesAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null);
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topViajantes($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topGastadoresViagensAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null);
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topGastadoresViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topDeputadosViajantesAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null, 'DEPUTADO');
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topViajantes($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topSenadoresViajantesAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null, 'SENADOR');
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topViajantes($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topDeputadosGastadoresViagensAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null, 'DEPUTADO');
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topGastadoresViagens($filtro, $pagination['limit'], $pagination['offset']);

        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset'],
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topSenadoresGastadoresViagensAno(mixed $_, array $args): array
    {
        $filtro = $this->yearRankingFiltro($args['ano'] ?? null, 'SENADOR');
        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $result = $this->gastoService->topGastadoresViagens($filtro, $pagination['limit'], $pagination['offset']);

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
     * @return array<string,mixed>
     */
    private function normalizeRankingFiltro(array $input): array
    {
        $periodo = $this->normalizePeriodo($input);
        $orgaoSuperiorCodigo = isset($input['orgaoSuperiorCodigo']) ? trim((string) $input['orgaoSuperiorCodigo']) : null;
        $orgaoSolicitanteCodigo = isset($input['orgaoSolicitanteCodigo']) ? trim((string) $input['orgaoSolicitanteCodigo']) : null;
        $search = isset($input['search']) ? trim((string) $input['search']) : null;
        $situacao = isset($input['situacao']) ? trim((string) $input['situacao']) : null;
        $processoId = isset($input['processoId']) ? trim((string) $input['processoId']) : null;
        $pcdp = isset($input['pcdp']) ? trim((string) $input['pcdp']) : null;
        $cpfViajante = isset($input['cpfViajante']) ? trim((string) $input['cpfViajante']) : null;
        $nomeViajante = isset($input['nomeViajante']) ? trim((string) $input['nomeViajante']) : null;
        $cargo = isset($input['cargo']) ? trim((string) $input['cargo']) : null;
        $funcao = isset($input['funcao']) ? trim((string) $input['funcao']) : null;
        $destino = isset($input['destino']) ? trim((string) $input['destino']) : null;
        $motivo = isset($input['motivo']) ? trim((string) $input['motivo']) : null;
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
            'anoInicio' => $periodo['anoInicio'],
            'anoFim' => $periodo['anoFim'],
            'orgaoSuperiorCodigo' => $orgaoSuperiorCodigo !== '' ? $orgaoSuperiorCodigo : null,
            'orgaoSolicitanteCodigo' => $orgaoSolicitanteCodigo !== '' ? $orgaoSolicitanteCodigo : null,
            'apenasParlamentares' => $apenasParlamentares,
            'cargoParlamentar' => $cargoParlamentar,
            'search' => $search !== '' ? $search : null,
            'situacao' => $situacao !== '' ? $situacao : null,
            'processoId' => $processoId !== '' ? $processoId : null,
            'pcdp' => $pcdp !== '' ? $pcdp : null,
            'cpfViajante' => $cpfViajante !== '' ? $cpfViajante : null,
            'nomeViajante' => $nomeViajante !== '' ? $nomeViajante : null,
            'cargo' => $cargo !== '' ? $cargo : null,
            'funcao' => $funcao !== '' ? $funcao : null,
            'destino' => $destino !== '' ? $destino : null,
            'motivo' => $motivo !== '' ? $motivo : null,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function yearRankingFiltro(mixed $anoInput, ?string $cargoParlamentar = null): array
    {
        $ano = (int) $anoInput;

        return [
            'anoInicio' => $ano >= 1900 ? $ano : null,
            'anoFim' => $ano >= 1900 ? $ano : null,
            'orgaoSuperiorCodigo' => null,
            'orgaoSolicitanteCodigo' => null,
            'apenasParlamentares' => $cargoParlamentar !== null,
            'cargoParlamentar' => $cargoParlamentar,
            'search' => null,
            'situacao' => null,
            'processoId' => null,
            'pcdp' => null,
            'cpfViajante' => null,
            'nomeViajante' => null,
            'cargo' => null,
            'funcao' => null,
            'destino' => null,
            'motivo' => null,
        ];
    }
}
