<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

interface GastoRepositoryInterface
{
    /**
     * @param array<int,string> $politicoIds
     * @param array{anoInicio?: int|null, anoFim?: int|null} $periodo
     * @return array<string, array<string,mixed>>
     */
    public function batchExpenseSummaryByPoliticoIds(array $politicoIds, array $periodo): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array<string,mixed>
     */
    public function summaryViagens(array $filtro): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array{nodes: array<int, array<string,mixed>>, total: int}
     */
    public function listViagens(array $filtro, int $limit, int $offset): array;

    /**
     * @param array{anoInicio?: int|null, anoFim?: int|null} $periodo
     * @return array{nodes: array<int, array<string,mixed>>, total: int}
     */
    public function listViagensByPoliticoId(string $politicoId, array $periodo, int $limit, int $offset): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topViajantes(array $filtro, int $limit, int $offset): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topGastadoresViagens(array $filtro, int $limit, int $offset): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topOrgaosSuperioresViagens(array $filtro, int $limit, int $offset): array;

    /**
     * @param array{
     *   anoInicio?:int|null,
     *   anoFim?:int|null,
     *   orgaoSuperiorCodigo?:string|null,
     *   orgaoSolicitanteCodigo?:string|null,
     *   apenasParlamentares?:bool|null,
     *   cargoParlamentar?:string|null,
     *   search?:string|null,
     *   situacao?:string|null,
     *   processoId?:string|null,
     *   pcdp?:string|null,
     *   cpfViajante?:string|null,
     *   nomeViajante?:string|null,
     *   cargo?:string|null,
     *   funcao?:string|null,
     *   destino?:string|null,
     *   motivo?:string|null
     * } $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topOrgaosSolicitantesViagens(array $filtro, int $limit, int $offset): array;

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listPassagensByProcessoId(string $processoId, int $limit, int $offset): array;

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchPassagensByProcessoIds(array $processoIds, int $limit, int $offset): array;

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listPagamentosByProcessoId(string $processoId, int $limit, int $offset): array;

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchPagamentosByProcessoIds(array $processoIds, int $limit, int $offset): array;

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listTrechosByProcessoId(string $processoId, int $limit, int $offset): array;

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    public function batchTrechosByProcessoIds(array $processoIds, int $limit, int $offset): array;
}
