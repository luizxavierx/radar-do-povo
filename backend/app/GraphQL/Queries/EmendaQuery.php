<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\EmendaService;

final class EmendaQuery
{
    public function __construct(private readonly EmendaService $emendaService) {}

    /**
     * @param array<string,mixed> $args
     * @return array<string,mixed>
     */
    public function emendasResumoPolitico(mixed $_, array $args): array
    {
        $input = $args['input'] ?? [];
        $politicoId = trim((string) ($input['politicoId'] ?? ''));
        if ($politicoId === '') {
            return $this->emptyResumo([
                'anoInicio' => null,
                'anoFim' => null,
                'uf' => null,
                'tipoEmenda' => null,
                'pais' => null,
                'apenasParlamentares' => null,
                'cargoParlamentar' => null,
            ]);
        }

        $filtro = $this->normalizeFiltro($input['filtro'] ?? []);
        return $this->emendaService->summaryByPoliticoId($politicoId, $filtro);
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function emendasPolitico(mixed $_, array $args): array
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

        $filtro = $this->normalizeFiltro($input['filtro'] ?? []);
        $limit = isset($paginationInput['limit']) ? (int) $paginationInput['limit'] : 20;
        $offset = isset($paginationInput['offset']) ? (int) $paginationInput['offset'] : 0;
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $result = $this->emendaService->listByPoliticoId($politicoId, $filtro, $limit, $offset);
        return [
            'nodes' => $result['nodes'],
            'total' => $result['total'],
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    /**
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topGastadoresEmendas(mixed $_, array $args): array
    {
        $filtro = $this->normalizeFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);

        $result = $this->emendaService->topGastadores(
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
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topGastadoresEmendasAno(mixed $_, array $args): array
    {
        $ano = isset($args['ano']) ? (int) $args['ano'] : 0;
        if ($ano < 1900) {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 30,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $filtro = [
            'anoInicio' => $ano,
            'anoFim' => $ano,
            'uf' => null,
            'tipoEmenda' => null,
            'pais' => null,
            'apenasParlamentares' => true,
            'cargoParlamentar' => null,
        ];

        $result = $this->emendaService->topGastadores(
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
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topEmendasPorPais(mixed $_, array $args): array
    {
        $filtro = $this->normalizeFiltro($args['filtro'] ?? []);
        if ($filtro['apenasParlamentares'] === null) {
            $filtro['apenasParlamentares'] = true;
        }
        $pagination = $this->normalizePagination($args['pagination'] ?? []);

        $result = $this->emendaService->topPorPais(
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
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topEmendasPorPaisAno(mixed $_, array $args): array
    {
        $ano = isset($args['ano']) ? (int) $args['ano'] : 0;
        if ($ano < 1900) {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 30,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $filtro = [
            'anoInicio' => $ano,
            'anoFim' => $ano,
            'uf' => null,
            'tipoEmenda' => null,
            'pais' => null,
            'apenasParlamentares' => true,
            'cargoParlamentar' => null,
        ];

        $result = $this->emendaService->topPorPais(
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
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topDeputadosEmendasAno(mixed $_, array $args): array
    {
        $ano = isset($args['ano']) ? (int) $args['ano'] : 0;
        if ($ano < 1900) {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 30,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $filtro = [
            'anoInicio' => $ano,
            'anoFim' => $ano,
            'uf' => null,
            'tipoEmenda' => null,
            'pais' => null,
            'apenasParlamentares' => true,
            'cargoParlamentar' => 'DEPUTADO',
        ];

        $result = $this->emendaService->topGastadores(
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
     * @param array<string,mixed> $args
     * @return array{nodes: array<int,array<string,mixed>>, total: int, limit: int, offset: int}
     */
    public function topSenadoresEmendasAno(mixed $_, array $args): array
    {
        $ano = isset($args['ano']) ? (int) $args['ano'] : 0;
        if ($ano < 1900) {
            return [
                'nodes' => [],
                'total' => 0,
                'limit' => 30,
                'offset' => 0,
            ];
        }

        $pagination = $this->normalizePagination($args['pagination'] ?? []);
        $filtro = [
            'anoInicio' => $ano,
            'anoFim' => $ano,
            'uf' => null,
            'tipoEmenda' => null,
            'pais' => null,
            'apenasParlamentares' => true,
            'cargoParlamentar' => 'SENADOR',
        ];

        $result = $this->emendaService->topGastadores(
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
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function normalizeFiltro(array $input): array
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
     * @param array<string,mixed> $input
     * @return array{limit:int,offset:int}
     */
    private function normalizePagination(array $input): array
    {
        $limit = isset($input['limit']) ? (int) $input['limit'] : 30;
        $offset = isset($input['offset']) ? (int) $input['offset'] : 0;
        $maxPageSize = (int) config('radar.max_page_size', 20);

        return [
            'limit' => max(1, min($limit, max(1, $maxPageSize))),
            'offset' => max(0, $offset),
        ];
    }

    /**
     * @param array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string} $filtro
     * @return array<string,mixed>
     */
    private function emptyResumo(array $filtro): array
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
}
