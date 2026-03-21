<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

interface EmendaRepositoryInterface
{
    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array<string,mixed>
     */
    public function summaryByPoliticoId(string $politicoId, array $filtro): array;

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listByPoliticoId(string $politicoId, array $filtro, int $limit, int $offset): array;

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topGastadores(array $filtro, int $limit, int $offset): array;

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function topPorPais(array $filtro, int $limit, int $offset): array;

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listConveniosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array;

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function listFavorecidosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array;
}
