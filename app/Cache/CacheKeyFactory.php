<?php

declare(strict_types=1);

namespace App\Cache;

final class CacheKeyFactory
{
    public static function politicoById(string $id): string
    {
        return "politico:id:{$id}";
    }

    public static function politicoByNomeCanonico(string $nomeCanonico): string
    {
        return 'politico:nome_canonico:' . mb_strtolower(trim($nomeCanonico));
    }

    /**
     * @param array<string,mixed> $filters
     */
    public static function politicosList(array $filters, int $limit, int $offset): string
    {
        ksort($filters);
        return 'politico:list:' . md5(json_encode([
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ], JSON_THROW_ON_ERROR));
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public static function gastoSummary(string $politicoId, array $periodo): string
    {
        return 'gasto:summary:' . $politicoId . ':' . self::periodoKey($periodo);
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoResumoViagens(array $filtro): string
    {
        return 'gasto:resumo_viagens:' . self::genericFilterKey($filtro);
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoViagensPainel(array $filtro, int $limit, int $offset): string
    {
        return 'gasto:viagens_painel:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoTopViajantes(array $filtro, int $limit, int $offset): string
    {
        return 'gasto:top_viajantes:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoTopGastadoresViagens(array $filtro, int $limit, int $offset): string
    {
        return 'gasto:top_gastadores_viagens:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoTopOrgaosSuperioresViagens(array $filtro, int $limit, int $offset): string
    {
        return 'gasto:top_orgaos_superiores_viagens:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array<string,mixed> $filtro
     */
    public static function gastoTopOrgaosSolicitantesViagens(array $filtro, int $limit, int $offset): string
    {
        return 'gasto:top_orgaos_solicitantes_viagens:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public static function viagensList(string $politicoId, array $periodo, int $limit, int $offset): string
    {
        return 'viagens:list:' . $politicoId . ':' . self::periodoKey($periodo) . ":{$limit}:{$offset}";
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null} $filtro
     */
    public static function emendaResumo(string $politicoId, array $filtro): string
    {
        return 'emenda:resumo:' . $politicoId . ':' . self::genericFilterKey($filtro);
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null} $filtro
     */
    public static function emendasList(string $politicoId, array $filtro, int $limit, int $offset): string
    {
        return 'emenda:list:' . $politicoId . ':' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null} $filtro
     */
    public static function emendaTopGastadores(array $filtro, int $limit, int $offset): string
    {
        return 'emenda:top_gastadores:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null} $filtro
     */
    public static function emendaTopPaises(array $filtro, int $limit, int $offset): string
    {
        return 'emenda:top_paises:' . self::genericFilterKey($filtro) . ":{$limit}:{$offset}";
    }

    public static function emendaConveniosList(string $codigoEmenda, int $limit, int $offset): string
    {
        return "emenda:convenios:{$codigoEmenda}:{$limit}:{$offset}";
    }

    public static function emendaFavorecidosList(string $codigoEmenda, int $limit, int $offset): string
    {
        return "emenda:favorecidos:{$codigoEmenda}:{$limit}:{$offset}";
    }

    /**
     * @param array<int,string> $sources
     */
    public static function externalProfile(string $politicoId, array $sources = []): string
    {
        if ($sources === []) {
            return "politico:external_profile:v4:{$politicoId}:all";
        }

        $normalized = array_values(array_unique(array_map(
            static fn (string $source): string => mb_strtolower(trim($source)),
            $sources,
        )));
        sort($normalized);
        $sourceKey = implode(',', $normalized);

        return "politico:external_profile:v4:{$politicoId}:{$sourceKey}";
    }

    public static function camaraByNome(string $nome): string
    {
        return 'provider:camara:' . mb_strtolower(trim($nome));
    }

    public static function wikipediaByUrl(string $url): string
    {
        return 'provider:wikipedia:v2:' . md5(trim($url));
    }

    public static function senadoByNome(string $nome): string
    {
        return 'provider:senado:' . mb_strtolower(trim($nome));
    }

    public static function tseByNome(string $nome): string
    {
        return 'provider:tse:' . mb_strtolower(trim($nome));
    }

    public static function lexmlByTerm(string $term, int $maxRecords): string
    {
        return 'provider:lexml:v2:' . md5(mb_strtolower(trim($term)) . ':' . $maxRecords);
    }

    public static function brasilIoByNome(string $nome, int $limit): string
    {
        return 'provider:brasilio:' . md5(mb_strtolower(trim($nome)) . ':' . $limit);
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    public static function expenseLoader(array $periodo): string
    {
        return 'expense_loader:' . self::periodoKey($periodo);
    }

    public static function viagemPassagensList(string $processoId, int $limit, int $offset): string
    {
        return "viagem:passagens:{$processoId}:{$limit}:{$offset}";
    }

    public static function viagemPagamentosList(string $processoId, int $limit, int $offset): string
    {
        return "viagem:pagamentos:{$processoId}:{$limit}:{$offset}";
    }

    public static function viagemTrechosList(string $processoId, int $limit, int $offset): string
    {
        return "viagem:trechos:{$processoId}:{$limit}:{$offset}";
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     */
    private static function periodoKey(array $periodo): string
    {
        $from = isset($periodo['anoInicio']) ? (string) $periodo['anoInicio'] : 'null';
        $to = isset($periodo['anoFim']) ? (string) $periodo['anoFim'] : 'null';

        return "from={$from},to={$to}";
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private static function genericFilterKey(array $filtro): string
    {
        ksort($filtro);
        return md5(json_encode($filtro, JSON_THROW_ON_ERROR));
    }
}
