<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\EmendaRepositoryInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class PostgresEmendaRepository implements EmendaRepositoryInterface
{
    public function summaryByPoliticoId(string $politicoId, array $filtro): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $nomes = $this->politicoNomes($politicoId);

        if ($nomes === []) {
            return $this->emptySummary($filtro);
        }

        $base = DB::table('emendas')->whereIn('nome_autor_emenda', $nomes);
        $this->applyEmendaFiltro($base, $filtro);

        $summary = (array) (clone $base)->selectRaw('
            COUNT(1)::bigint AS total_emendas,
            COALESCE(SUM(valor_empenhado_cents), 0)::bigint AS total_empenhado_cents,
            COALESCE(SUM(valor_liquidado_cents), 0)::bigint AS total_liquidado_cents,
            COALESCE(SUM(valor_pago_cents), 0)::bigint AS total_pago_cents,
            COALESCE(SUM(valor_rp_inscritos_cents), 0)::bigint AS total_rp_inscritos_cents,
            COALESCE(SUM(valor_rp_cancelados_cents), 0)::bigint AS total_rp_cancelados_cents,
            COALESCE(SUM(valor_rp_pagos_cents), 0)::bigint AS total_rp_pagos_cents
        ')->first();

        if ((int) ($summary['total_emendas'] ?? 0) === 0) {
            $fallback = DB::table('emendas');
            $this->applyTokenNameMatch($fallback, 'nome_autor_emenda', $nomes);
            $this->applyEmendaFiltro($fallback, $filtro);

            $summary = (array) (clone $fallback)->selectRaw('
                COUNT(1)::bigint AS total_emendas,
                COALESCE(SUM(valor_empenhado_cents), 0)::bigint AS total_empenhado_cents,
                COALESCE(SUM(valor_liquidado_cents), 0)::bigint AS total_liquidado_cents,
                COALESCE(SUM(valor_pago_cents), 0)::bigint AS total_pago_cents,
                COALESCE(SUM(valor_rp_inscritos_cents), 0)::bigint AS total_rp_inscritos_cents,
                COALESCE(SUM(valor_rp_cancelados_cents), 0)::bigint AS total_rp_cancelados_cents,
                COALESCE(SUM(valor_rp_pagos_cents), 0)::bigint AS total_rp_pagos_cents
            ')->first();
        }

        $favorecido = DB::table('emendas_por_favorecido')->whereIn('nome_autor_emenda', $nomes);
        $this->applyFavorecidoFiltro($favorecido, $filtro);

        $favSummary = (array) (clone $favorecido)->selectRaw("
            COALESCE(SUM(valor_recebido_cents), 0)::bigint AS total_recebido_favorecidos_cents,
            COUNT(DISTINCT COALESCE(NULLIF(codigo_favorecido, ''), favorecido))::bigint AS total_favorecidos
        ")->first();

        if ((int) ($favSummary['total_favorecidos'] ?? 0) === 0) {
            $favFallback = DB::table('emendas_por_favorecido');
            $this->applyTokenNameMatch($favFallback, 'nome_autor_emenda', $nomes);
            $this->applyFavorecidoFiltro($favFallback, $filtro);

            $favSummary = (array) (clone $favFallback)->selectRaw("
                COALESCE(SUM(valor_recebido_cents), 0)::bigint AS total_recebido_favorecidos_cents,
                COUNT(DISTINCT COALESCE(NULLIF(codigo_favorecido, ''), favorecido))::bigint AS total_favorecidos
            ")->first();
        }

        return [
            'totalEmendas' => (int) ($summary['total_emendas'] ?? 0),
            'totalEmpenhadoCents' => (int) ($summary['total_empenhado_cents'] ?? 0),
            'totalLiquidadoCents' => (int) ($summary['total_liquidado_cents'] ?? 0),
            'totalPagoCents' => (int) ($summary['total_pago_cents'] ?? 0),
            'totalRpInscritosCents' => (int) ($summary['total_rp_inscritos_cents'] ?? 0),
            'totalRpCanceladosCents' => (int) ($summary['total_rp_cancelados_cents'] ?? 0),
            'totalRpPagosCents' => (int) ($summary['total_rp_pagos_cents'] ?? 0),
            'totalRecebidoFavorecidosCents' => (int) ($favSummary['total_recebido_favorecidos_cents'] ?? 0),
            'totalFavorecidos' => (int) ($favSummary['total_favorecidos'] ?? 0),
            'periodo' => [
                'anoInicio' => $filtro['anoInicio'],
                'anoFim' => $filtro['anoFim'],
            ],
        ];
    }

    public function listByPoliticoId(string $politicoId, array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $nomes = $this->politicoNomes($politicoId);

        if ($nomes === []) {
            return ['nodes' => [], 'total' => 0];
        }

        $base = DB::table('emendas')->whereIn('nome_autor_emenda', $nomes);
        $this->applyEmendaFiltro($base, $filtro);

        $total = (int) (clone $base)->count();

        if ($total === 0) {
            $base = DB::table('emendas');
            $this->applyTokenNameMatch($base, 'nome_autor_emenda', $nomes);
            $this->applyEmendaFiltro($base, $filtro);
            $total = (int) (clone $base)->count();
        }

        $nodes = (clone $base)
            ->select([
                'id',
                'codigo_emenda',
                'ano_emenda',
                'tipo_emenda',
                'codigo_autor_emenda',
                'nome_autor_emenda',
                'numero_emenda',
                'localidade_aplicacao',
                'codigo_municipio_ibge',
                'municipio',
                'codigo_uf_ibge',
                'uf',
                'regiao',
                'codigo_funcao',
                'nome_funcao',
                'codigo_subfuncao',
                'nome_subfuncao',
                'codigo_programa',
                'nome_programa',
                'codigo_acao',
                'nome_acao',
                'codigo_plano_orcamentario',
                'nome_plano_orcamentario',
                DB::raw('COALESCE(valor_empenhado_cents, 0) AS valor_empenhado_cents'),
                DB::raw('COALESCE(valor_liquidado_cents, 0) AS valor_liquidado_cents'),
                DB::raw('COALESCE(valor_pago_cents, 0) AS valor_pago_cents'),
                DB::raw('COALESCE(valor_rp_inscritos_cents, 0) AS valor_rp_inscritos_cents'),
                DB::raw('COALESCE(valor_rp_cancelados_cents, 0) AS valor_rp_cancelados_cents'),
                DB::raw('COALESCE(valor_rp_pagos_cents, 0) AS valor_rp_pagos_cents'),
                'imported_at',
            ])
            ->orderByDesc('ano_emenda')
            ->orderByDesc('valor_pago_cents')
            ->orderBy('id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static fn ($row): array => (array) $row)
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function topGastadores(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);

        $base = DB::table('emendas')
            ->whereRaw("NULLIF(BTRIM(nome_autor_emenda), '') IS NOT NULL");

        $this->applyEmendaFiltro($base, $filtro);

        $grouped = (clone $base)
            ->select(['codigo_autor_emenda', 'nome_autor_emenda'])
            ->groupBy('codigo_autor_emenda', 'nome_autor_emenda');

        $total = (int) DB::query()
            ->fromSub($grouped, 'g')
            ->count();

        $nodes = (clone $base)
            ->selectRaw('
                codigo_autor_emenda,
                nome_autor_emenda,
                COUNT(1)::bigint AS total_emendas,
                COALESCE(SUM(valor_empenhado_cents), 0)::bigint AS total_empenhado_cents,
                COALESCE(SUM(valor_liquidado_cents), 0)::bigint AS total_liquidado_cents,
                COALESCE(SUM(valor_pago_cents), 0)::bigint AS total_pago_cents,
                COALESCE(SUM(valor_rp_inscritos_cents), 0)::bigint AS total_rp_inscritos_cents,
                COALESCE(SUM(valor_rp_cancelados_cents), 0)::bigint AS total_rp_cancelados_cents,
                COALESCE(SUM(valor_rp_pagos_cents), 0)::bigint AS total_rp_pagos_cents
            ')
            ->groupBy('codigo_autor_emenda', 'nome_autor_emenda')
            ->orderByDesc('total_pago_cents')
            ->orderByDesc('total_empenhado_cents')
            ->orderBy('nome_autor_emenda')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static function ($row): array {
                return [
                    'codigo_autor_emenda' => $row->codigo_autor_emenda ?? null,
                    'nome_autor_emenda' => $row->nome_autor_emenda ?? null,
                    'total_emendas' => (int) ($row->total_emendas ?? 0),
                    'total_empenhado_cents' => $row->total_empenhado_cents ?? '0',
                    'total_liquidado_cents' => $row->total_liquidado_cents ?? '0',
                    'total_pago_cents' => $row->total_pago_cents ?? '0',
                    'total_rp_inscritos_cents' => $row->total_rp_inscritos_cents ?? '0',
                    'total_rp_cancelados_cents' => $row->total_rp_cancelados_cents ?? '0',
                    'total_rp_pagos_cents' => $row->total_rp_pagos_cents ?? '0',
                ];
            })
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function topPorPais(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeFiltro($filtro);
        $maxPageSize = (int) config('radar.max_page_size', 20);
        $limit = max(1, min($limit, max(1, $maxPageSize)));
        $offset = max(0, $offset);
        $paisExpr = $this->paisExpression('localidade_aplicacao');

        $base = DB::table('emendas');
        $this->applyEmendaFiltro($base, $filtro);

        $grouped = (clone $base)
            ->selectRaw($paisExpr . ' AS pais')
            ->groupByRaw($paisExpr);

        $total = (int) DB::query()
            ->fromSub($grouped, 'p')
            ->count();

        $nodes = (clone $base)
            ->selectRaw($paisExpr . '
                AS pais,
                COUNT(1)::bigint AS total_emendas,
                COALESCE(SUM(valor_empenhado_cents), 0)::bigint AS total_empenhado_cents,
                COALESCE(SUM(valor_liquidado_cents), 0)::bigint AS total_liquidado_cents,
                COALESCE(SUM(valor_pago_cents), 0)::bigint AS total_pago_cents,
                COALESCE(SUM(valor_rp_inscritos_cents), 0)::bigint AS total_rp_inscritos_cents,
                COALESCE(SUM(valor_rp_cancelados_cents), 0)::bigint AS total_rp_cancelados_cents,
                COALESCE(SUM(valor_rp_pagos_cents), 0)::bigint AS total_rp_pagos_cents
            ')
            ->groupByRaw($paisExpr)
            ->orderByDesc('total_pago_cents')
            ->orderBy('pais')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static function ($row): array {
                return [
                    'pais' => is_string($row->pais ?? null) && trim((string) $row->pais) !== '' ? (string) $row->pais : 'BRASIL',
                    'total_emendas' => (int) ($row->total_emendas ?? 0),
                    'total_empenhado_cents' => $row->total_empenhado_cents ?? '0',
                    'total_liquidado_cents' => $row->total_liquidado_cents ?? '0',
                    'total_pago_cents' => $row->total_pago_cents ?? '0',
                    'total_rp_inscritos_cents' => $row->total_rp_inscritos_cents ?? '0',
                    'total_rp_cancelados_cents' => $row->total_rp_cancelados_cents ?? '0',
                    'total_rp_pagos_cents' => $row->total_rp_pagos_cents ?? '0',
                ];
            })
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function listConveniosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array
    {
        $codigoEmenda = trim($codigoEmenda);
        if ($codigoEmenda === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $base = DB::table('emendas_convenios')->where('codigo_emenda', $codigoEmenda);
        $total = (int) (clone $base)->count();

        $nodes = (clone $base)
            ->select([
                'id',
                'codigo_emenda',
                'codigo_funcao',
                'nome_funcao',
                'codigo_subfuncao',
                'nome_subfuncao',
                'localidade_gasto',
                'tipo_emenda',
                'data_publicacao_convenio',
                'convenente',
                'objeto_convenio',
                'numero_convenio',
                DB::raw('COALESCE(valor_convenio_cents, 0) AS valor_convenio_cents'),
                'imported_at',
            ])
            ->orderByDesc('data_publicacao_convenio')
            ->orderBy('id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static fn ($row): array => (array) $row)
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function listFavorecidosByCodigoEmenda(string $codigoEmenda, int $limit, int $offset): array
    {
        $codigoEmenda = trim($codigoEmenda);
        if ($codigoEmenda === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $base = DB::table('emendas_por_favorecido')->where('codigo_emenda', $codigoEmenda);
        $total = (int) (clone $base)->count();

        $nodes = (clone $base)
            ->select([
                'id',
                'codigo_emenda',
                'codigo_autor_emenda',
                'nome_autor_emenda',
                'numero_emenda',
                'tipo_emenda',
                'ano_mes',
                'codigo_favorecido',
                'favorecido',
                'natureza_juridica',
                'tipo_favorecido',
                'uf_favorecido',
                'municipio_favorecido',
                DB::raw('COALESCE(valor_recebido_cents, 0) AS valor_recebido_cents'),
                'imported_at',
            ])
            ->orderByDesc('ano_mes')
            ->orderByDesc('valor_recebido_cents')
            ->orderBy('id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static fn ($row): array => (array) $row)
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    /**
     * @return array<int,string>
     */
    private function politicoNomes(string $politicoId): array
    {
        $row = DB::table('politicos')
            ->select(['nome_completo', 'nome_canonico', 'nome_busca'])
            ->where(DB::raw('id::text'), $politicoId)
            ->first();

        if ($row === null) {
            return [];
        }

        $baseNames = collect([
            $row->nome_completo,
            $row->nome_canonico,
            $row->nome_busca,
        ])
            ->filter(static fn ($v): bool => is_string($v) && trim($v) !== '')
            ->map(fn ($v): string => $this->normalizeName((string) $v))
            ->filter(static fn (string $v): bool => $v !== '')
            ->unique()
            ->values()
            ->all();

        return $this->expandNameVariants($baseNames);
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     */
    private function applyEmendaFiltro(Builder $query, array $filtro): void
    {
        if ($filtro['anoInicio'] !== null) {
            $query->where('ano_emenda', '>=', $filtro['anoInicio']);
        }
        if ($filtro['anoFim'] !== null) {
            $query->where('ano_emenda', '<=', $filtro['anoFim']);
        }
        if ($filtro['uf'] !== null) {
            $query->where('uf', $filtro['uf']);
        }
        if ($filtro['tipoEmenda'] !== null) {
            $query->where('tipo_emenda', $filtro['tipoEmenda']);
        }
        if ($filtro['pais'] !== null) {
            $query->whereRaw($this->paisExpression('localidade_aplicacao') . ' = ?', [$filtro['pais']]);
        }
        if ($filtro['cargoParlamentar'] !== null) {
            $this->applyCargoParlamentarFiltro($query, $filtro['cargoParlamentar']);
        }
        if (($filtro['apenasParlamentares'] ?? null) === true) {
            $this->applyParlamentaresOnlyFiltro($query);
        }
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null,uf?:string|null,tipoEmenda?:string|null,pais?:string|null,apenasParlamentares?:bool|null,cargoParlamentar?:string|null} $filtro
     */
    private function applyFavorecidoFiltro(Builder $query, array $filtro): void
    {
        if ($filtro['anoInicio'] !== null) {
            $query->whereRaw("substring(ano_mes from 1 for 4)::int >= ?", [$filtro['anoInicio']]);
        }
        if ($filtro['anoFim'] !== null) {
            $query->whereRaw("substring(ano_mes from 1 for 4)::int <= ?", [$filtro['anoFim']]);
        }
        if ($filtro['uf'] !== null) {
            $query->where('uf_favorecido', $filtro['uf']);
        }
        if ($filtro['tipoEmenda'] !== null) {
            $query->where('tipo_emenda', $filtro['tipoEmenda']);
        }
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string}
     */
    private function normalizeFiltro(array $filtro): array
    {
        $from = isset($filtro['anoInicio']) ? (int) $filtro['anoInicio'] : null;
        $to = isset($filtro['anoFim']) ? (int) $filtro['anoFim'] : null;
        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        $uf = isset($filtro['uf']) ? trim((string) $filtro['uf']) : null;
        $tipo = isset($filtro['tipoEmenda']) ? trim((string) $filtro['tipoEmenda']) : null;
        $pais = isset($filtro['pais']) ? trim((string) $filtro['pais']) : null;
        $apenasParlamentares = array_key_exists('apenasParlamentares', $filtro)
            ? (bool) $filtro['apenasParlamentares']
            : null;
        $cargoParlamentar = isset($filtro['cargoParlamentar'])
            ? mb_strtoupper(trim((string) $filtro['cargoParlamentar']), 'UTF-8')
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

    private function applyCargoParlamentarFiltro(Builder $query, string $cargoParlamentar): void
    {
        $isSenador = $cargoParlamentar === 'SENADOR';
        $nomeRegex = $isSenador
            ? "(^|\\s)(sen\\.?|senador)"
            : "(^|\\s)(dep\\.?|deputad)";
        $cargoLike = $isSenador ? '%senador%' : '%deputad%';

        $query->where(function (Builder $nested) use ($nomeRegex, $cargoLike): void {
            $nested->whereRaw("COALESCE(nome_autor_emenda, '') ~* ?", [$nomeRegex])
                ->orWhereExists(function (Builder $sub) use ($cargoLike): void {
                    $sub->select(DB::raw('1'))
                        ->from('politicos as p')
                        ->whereRaw("
                            lower(trim(COALESCE(p.nome_completo, ''))) = lower(trim(COALESCE(emendas.nome_autor_emenda, '')))
                            OR lower(trim(COALESCE(p.nome_canonico, ''))) = lower(trim(COALESCE(emendas.nome_autor_emenda, '')))
                            OR lower(trim(COALESCE(p.nome_busca, ''))) = lower(trim(COALESCE(emendas.nome_autor_emenda, '')))
                        ")
                        ->whereRaw("COALESCE(p.cargo_atual, '') ILIKE ?", [$cargoLike]);
                });
        });
    }

    private function applyParlamentaresOnlyFiltro(Builder $query): void
    {
        $query->whereRaw("COALESCE(nome_autor_emenda, '') !~* '(bancada|comissao|comissão|bloco|partido|lideranca|liderança)'");
        $query->whereRaw("COALESCE(tipo_emenda, '') !~* '(bancada|comissao|comissão)'");
        $query->whereRaw("COALESCE(codigo_autor_emenda, '') !~* '(bancada|comissao|comissão|bloco|partido)'");
    }

    private function paisExpression(string $column): string
    {
        return "CASE
            WHEN {$column} IS NULL OR BTRIM({$column}) = '' THEN 'BRASIL'
            WHEN {$column} ILIKE '%ESTADOS UNIDOS%' OR {$column} ILIKE '%EUA%' OR {$column} ILIKE '%USA%' THEN 'ESTADOS UNIDOS'
            WHEN {$column} ILIKE '%ARGENTINA%' THEN 'ARGENTINA'
            WHEN {$column} ILIKE '%PARAGUAI%' THEN 'PARAGUAI'
            WHEN {$column} ILIKE '%URUGUAI%' THEN 'URUGUAI'
            WHEN {$column} ILIKE '%CHILE%' THEN 'CHILE'
            WHEN {$column} ILIKE '%BOLIVIA%' THEN 'BOLIVIA'
            WHEN {$column} ILIKE '%PERU%' THEN 'PERU'
            WHEN {$column} ILIKE '%COLOMBIA%' THEN 'COLOMBIA'
            WHEN {$column} ILIKE '%VENEZUELA%' THEN 'VENEZUELA'
            WHEN {$column} ILIKE '%MEXICO%' THEN 'MEXICO'
            WHEN {$column} ILIKE '%PORTUGAL%' THEN 'PORTUGAL'
            WHEN {$column} ILIKE '%ESPANHA%' THEN 'ESPANHA'
            WHEN {$column} ILIKE '%FRANCA%' THEN 'FRANCA'
            WHEN {$column} ILIKE '%ALEMANHA%' THEN 'ALEMANHA'
            WHEN {$column} ILIKE '%ITALIA%' THEN 'ITALIA'
            WHEN {$column} ILIKE '%REINO UNIDO%' THEN 'REINO UNIDO'
            WHEN {$column} ILIKE '%CANADA%' THEN 'CANADA'
            WHEN {$column} ILIKE '%JAPAO%' THEN 'JAPAO'
            WHEN {$column} ILIKE '%CHINA%' THEN 'CHINA'
            WHEN {$column} ILIKE '%EXTERIOR%' THEN 'EXTERIOR'
            ELSE 'BRASIL'
        END";
    }

    private function normalizeName(string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            return '';
        }

        return preg_replace('/\s+/u', ' ', $name) ?? $name;
    }

    /**
     * @param array<int,string> $baseNames
     * @return array<int,string>
     */
    private function expandNameVariants(array $baseNames): array
    {
        $variants = [];
        foreach ($baseNames as $name) {
            $normalized = $this->normalizeName($name);
            if ($normalized === '') {
                continue;
            }

            $variants[] = $normalized;
            $variants[] = mb_strtoupper($normalized, 'UTF-8');
            $variants[] = mb_strtolower($normalized, 'UTF-8');

            $ascii = $this->toAscii($normalized);
            if ($ascii !== $normalized) {
                $variants[] = $ascii;
                $variants[] = mb_strtoupper($ascii, 'UTF-8');
                $variants[] = mb_strtolower($ascii, 'UTF-8');
            }
        }

        return array_values(array_unique(array_filter($variants, static fn (string $v): bool => $v !== '')));
    }

    private function toAscii(string $name): string
    {
        if (!function_exists('iconv')) {
            return $name;
        }

        $converted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        if ($converted === false) {
            return $name;
        }

        return $this->normalizeName($converted);
    }

    /**
     * @param array<int,string> $names
     */
    private function applyTokenNameMatch(Builder $query, string $column, array $names): void
    {
        $tokens = $this->matchingTokens($names);
        if ($tokens === []) {
            return;
        }

        $tokensToUse = count($tokens) >= 2 ? array_slice($tokens, 0, 2) : [$tokens[0]];
        if (count($tokensToUse) === 1 && mb_strlen($tokensToUse[0], 'UTF-8') < 4) {
            return;
        }

        foreach ($tokensToUse as $token) {
            $query->where($column, 'ILIKE', '%' . $token . '%');
        }
    }

    /**
     * @param array<int,string> $names
     * @return array<int,string>
     */
    private function matchingTokens(array $names): array
    {
        $stopWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
        $tokens = [];

        foreach ($names as $name) {
            $ascii = mb_strtolower($this->toAscii($name), 'UTF-8');
            $parts = preg_split('/[^a-z0-9]+/u', $ascii) ?: [];

            foreach ($parts as $part) {
                $part = trim($part);
                if ($part === '') {
                    continue;
                }
                if (mb_strlen($part, 'UTF-8') < 3) {
                    continue;
                }
                if (in_array($part, $stopWords, true)) {
                    continue;
                }
                $tokens[$part] = mb_strlen($part, 'UTF-8');
            }
        }

        arsort($tokens);
        return array_slice(array_keys($tokens), 0, 3);
    }

    /**
     * @param array{anoInicio:?int,anoFim:?int,uf:?string,tipoEmenda:?string,pais:?string,apenasParlamentares:?bool,cargoParlamentar:?string} $filtro
     * @return array<string,mixed>
     */
    private function emptySummary(array $filtro): array
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
