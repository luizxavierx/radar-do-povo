<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\GastoRepositoryInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class PostgresGastoRepository implements GastoRepositoryInterface
{
    /**
     * @var array<string,array<int,string>>
     */
    private static array $parlamentarNomeVariantsCache = [];

    public function batchExpenseSummaryByPoliticoIds(array $politicoIds, array $periodo): array
    {
        if ($politicoIds === []) {
            return [];
        }

        [$anoInicio, $anoFim] = $this->normalizePeriodo($periodo);
        $nomesByPolitico = $this->loadNomesByPoliticoIds($politicoIds);

        $todosNomes = collect($nomesByPolitico)
            ->flatten()
            ->filter()
            ->unique()
            ->values();

        if ($todosNomes->isEmpty()) {
            return $this->emptySummaries($politicoIds, $anoInicio, $anoFim);
        }

        $viagens = $this->aggregateViagensByNome($todosNomes, $anoInicio, $anoFim);
        $pagamentos = $this->aggregatePagamentosByNome($todosNomes, $anoInicio, $anoFim);
        $trechos = $this->aggregateTrechosByNome($todosNomes, $anoInicio, $anoFim);

        $out = [];
        foreach ($politicoIds as $politicoId) {
            $summary = [
                'totalViagens' => 0,
                'totalTrechos' => 0,
                'totalDiariasCents' => 0,
                'totalPassagensCents' => 0,
                'totalPagamentosCents' => 0,
                'totalOutrosGastosCents' => 0,
                'totalDevolucaoCents' => 0,
                'periodo' => [
                    'anoInicio' => $anoInicio,
                    'anoFim' => $anoFim,
                ],
            ];

            foreach ($nomesByPolitico[$politicoId] ?? [] as $nome) {
                if (isset($viagens[$nome])) {
                    $summary['totalViagens'] += (int) $viagens[$nome]['total_viagens'];
                    $summary['totalDiariasCents'] += (int) $viagens[$nome]['total_diarias_cents'];
                    $summary['totalPassagensCents'] += (int) $viagens[$nome]['total_passagens_cents'];
                    $summary['totalOutrosGastosCents'] += (int) $viagens[$nome]['total_outros_gastos_cents'];
                    $summary['totalDevolucaoCents'] += (int) $viagens[$nome]['total_devolucao_cents'];
                }
                if (isset($pagamentos[$nome])) {
                    $summary['totalPagamentosCents'] += (int) $pagamentos[$nome]['total_pagamentos_cents'];
                }
                if (isset($trechos[$nome])) {
                    $summary['totalTrechos'] += (int) $trechos[$nome]['total_trechos'];
                }
            }

            $out[$politicoId] = $summary;
        }

        return $out;
    }

    public function summaryViagens(array $filtro): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $base = $this->buildViagemAggregateBaseQuery($filtro);

        $row = $base
            ->selectRaw("
                COUNT(DISTINCT v.processo_id)::bigint AS total_viagens,
                COUNT(DISTINCT COALESCE(NULLIF(v.cpf_viajante, ''), NULLIF(BTRIM(v.nome_viajante), '')))::bigint AS total_viajantes,
                COUNT(DISTINCT NULLIF(v.orgao_superior_codigo, ''))::bigint AS total_orgaos_superiores,
                COUNT(DISTINCT NULLIF(v.orgao_solicitante_codigo, ''))::bigint AS total_orgaos_solicitantes,
                COALESCE(SUM(COALESCE(tre_agg.total_trechos, 0)), 0)::bigint AS total_trechos,
                COALESCE(SUM(COALESCE(v.valor_diarias_cents, 0)), 0)::bigint AS total_diarias_cents,
                COALESCE(SUM(COALESCE(v.valor_passagens_cents, 0)), 0)::bigint AS total_passagens_cents,
                COALESCE(SUM(COALESCE(v.valor_outros_gastos_cents, 0)), 0)::bigint AS total_outros_gastos_cents,
                COALESCE(SUM(COALESCE(v.valor_devolucao_cents, 0)), 0)::bigint AS total_devolucao_cents,
                COALESCE(SUM(COALESCE(pag_agg.total_pagamentos_cents, 0)), 0)::bigint AS total_pagamentos_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                ), 0)::bigint AS total_gasto_bruto_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                    - COALESCE(v.valor_devolucao_cents, 0)
                ), 0)::bigint AS total_gasto_liquido_cents
            ")
            ->first();

        $totalViagens = (int) ($row->total_viagens ?? 0);
        $totalViajantes = (int) ($row->total_viajantes ?? 0);
        $totalGastoLiquido = (int) ($row->total_gasto_liquido_cents ?? 0);

        return [
            'total_viagens' => $totalViagens,
            'total_viajantes' => $totalViajantes,
            'total_orgaos_superiores' => (int) ($row->total_orgaos_superiores ?? 0),
            'total_orgaos_solicitantes' => (int) ($row->total_orgaos_solicitantes ?? 0),
            'total_trechos' => (int) ($row->total_trechos ?? 0),
            'total_diarias_cents' => $row->total_diarias_cents ?? '0',
            'total_passagens_cents' => $row->total_passagens_cents ?? '0',
            'total_pagamentos_cents' => $row->total_pagamentos_cents ?? '0',
            'total_outros_gastos_cents' => $row->total_outros_gastos_cents ?? '0',
            'total_devolucao_cents' => $row->total_devolucao_cents ?? '0',
            'total_gasto_bruto_cents' => $row->total_gasto_bruto_cents ?? '0',
            'total_gasto_liquido_cents' => $row->total_gasto_liquido_cents ?? '0',
            'ticket_medio_viagem_cents' => (string) ($totalViagens > 0 ? (int) floor($totalGastoLiquido / $totalViagens) : 0),
            'gasto_medio_viajante_cents' => (string) ($totalViajantes > 0 ? (int) floor($totalGastoLiquido / $totalViajantes) : 0),
            'periodo' => [
                'anoInicio' => $filtro['anoInicio'],
                'anoFim' => $filtro['anoFim'],
            ],
        ];
    }

    public function listViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $processosBase = $this->buildViagemProcessosBaseQuery($filtro);
        $total = (int) DB::query()
            ->fromSub(clone $processosBase, 'vf')
            ->count();

        $nodes = DB::table('viagens as v')
            ->joinSub(clone $processosBase, 'vf', static function ($join): void {
                $join->on('vf.processo_id', '=', 'v.processo_id');
            })
            ->select([
                'v.processo_id',
                'v.pcdp',
                'v.situacao',
                'v.viagem_urgente',
                'v.justificativa_urgencia',
                'v.orgao_superior_codigo',
                'v.orgao_superior_nome',
                'v.orgao_solicitante_codigo',
                'v.orgao_solicitante_nome',
                'v.cpf_viajante',
                'v.nome_viajante',
                'v.cargo',
                'v.funcao',
                'v.descricao_funcao',
                'v.data_inicio',
                'v.data_fim',
                'v.destinos',
                'v.motivo',
                DB::raw('COALESCE(v.valor_diarias_cents, 0) AS valor_diarias_cents'),
                DB::raw('COALESCE(v.valor_passagens_cents, 0) AS valor_passagens_cents'),
                DB::raw('COALESCE(v.valor_devolucao_cents, 0) AS valor_devolucao_cents'),
                DB::raw('COALESCE(v.valor_outros_gastos_cents, 0) AS valor_outros_gastos_cents'),
                'v.ano',
                'v.imported_at',
            ])
            ->orderByDesc('v.data_inicio')
            ->orderBy('v.processo_id')
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

    public function listViagensByPoliticoId(string $politicoId, array $periodo, int $limit, int $offset): array
    {
        [$anoInicio, $anoFim] = $this->normalizePeriodo($periodo);
        $nomesByPolitico = $this->loadNomesByPoliticoIds([$politicoId]);
        $nomes = collect($nomesByPolitico[$politicoId] ?? [])
            ->filter()
            ->unique()
            ->values();

        if ($nomes->isEmpty()) {
            return [
                'nodes' => [],
                'total' => 0,
            ];
        }

        $base = DB::table('viagens')
            ->whereIn('nome_viajante', $nomes->all());

        if ($anoInicio !== null) {
            $base->where('ano', '>=', $anoInicio);
        }
        if ($anoFim !== null) {
            $base->where('ano', '<=', $anoFim);
        }

        $total = (clone $base)->distinct('processo_id')->count('processo_id');

        $enableTokenFallback = (bool) config('radar.enable_viagens_token_fallback', false);
        if ((int) $total === 0 && $enableTokenFallback) {
            $fallback = DB::table('viagens');
            $this->applyTokenNameMatch($fallback, 'nome_viajante', $nomes->all());
            if ($anoInicio !== null) {
                $fallback->where('ano', '>=', $anoInicio);
            }
            if ($anoFim !== null) {
                $fallback->where('ano', '<=', $anoFim);
            }

            $base = $fallback;
            $total = (clone $base)->distinct('processo_id')->count('processo_id');
        }

        $nodes = (clone $base)
            ->select([
                'processo_id',
                'pcdp',
                'situacao',
                'viagem_urgente',
                'justificativa_urgencia',
                'orgao_superior_codigo',
                'orgao_superior_nome',
                'orgao_solicitante_codigo',
                'orgao_solicitante_nome',
                'cpf_viajante',
                'nome_viajante',
                'cargo',
                'funcao',
                'descricao_funcao',
                'data_inicio',
                'data_fim',
                'destinos',
                'motivo',
                DB::raw('COALESCE(valor_diarias_cents, 0) AS valor_diarias_cents'),
                DB::raw('COALESCE(valor_passagens_cents, 0) AS valor_passagens_cents'),
                DB::raw('COALESCE(valor_devolucao_cents, 0) AS valor_devolucao_cents'),
                DB::raw('COALESCE(valor_outros_gastos_cents, 0) AS valor_outros_gastos_cents'),
                'ano',
                'imported_at',
            ])
            ->orderByDesc('data_inicio')
            ->orderBy('processo_id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static fn ($row): array => (array) $row)
            ->all();

        return [
            'nodes' => $nodes,
            'total' => (int) $total,
        ];
    }

    public function topViajantes(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $base = $this->buildViagemRankingQuery($filtro);

        $total = (int) DB::query()
            ->fromSub(clone $base, 'ranking_viagens')
            ->count();

        $nodes = (clone $base)
            ->orderByDesc('total_viagens')
            ->orderByDesc('total_gasto_liquido_cents')
            ->orderBy('nome_viajante')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(fn ($row): array => $this->mapViagemRankingRow($row))
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function topOrgaosSuperioresViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $base = $this->buildViagemOrgaoRankingQuery($filtro, 'v.orgao_superior_codigo', 'v.orgao_superior_nome');

        $total = (int) DB::query()
            ->fromSub(clone $base, 'ranking_orgaos_superiores_viagens')
            ->count();

        $nodes = (clone $base)
            ->orderByDesc('total_gasto_liquido_cents')
            ->orderByDesc('total_viagens')
            ->orderBy('nome_orgao')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(fn ($row): array => $this->mapViagemOrgaoRankingRow($row))
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function topOrgaosSolicitantesViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $base = $this->buildViagemOrgaoRankingQuery($filtro, 'v.orgao_solicitante_codigo', 'v.orgao_solicitante_nome');

        $total = (int) DB::query()
            ->fromSub(clone $base, 'ranking_orgaos_solicitantes_viagens')
            ->count();

        $nodes = (clone $base)
            ->orderByDesc('total_gasto_liquido_cents')
            ->orderByDesc('total_viagens')
            ->orderBy('nome_orgao')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(fn ($row): array => $this->mapViagemOrgaoRankingRow($row))
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function topGastadoresViagens(array $filtro, int $limit, int $offset): array
    {
        $filtro = $this->normalizeRankingFiltro($filtro);
        $base = $this->buildViagemRankingQuery($filtro);

        $total = (int) DB::query()
            ->fromSub(clone $base, 'ranking_gastos_viagens')
            ->count();

        $nodes = (clone $base)
            ->orderByDesc('total_gasto_liquido_cents')
            ->orderByDesc('total_pagamentos_cents')
            ->orderByDesc('total_viagens')
            ->orderBy('nome_viajante')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(fn ($row): array => $this->mapViagemRankingRow($row))
            ->all();

        return [
            'nodes' => $nodes,
            'total' => $total,
        ];
    }

    public function listPassagensByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $batch = $this->batchPassagensByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    public function batchPassagensByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $ids = $this->normalizeProcessoIds($processoIds);
        if ($ids === []) {
            return [];
        }

        $result = $this->emptyBatchConnectionResult($ids);
        $totalRows = DB::table('passagens')
            ->selectRaw('processo_id, COUNT(*)::bigint AS total')
            ->whereIn('processo_id', $ids)
            ->groupBy('processo_id')
            ->get();

        foreach ($totalRows as $row) {
            $pid = (string) $row->processo_id;
            if (isset($result[$pid])) {
                $result[$pid]['total'] = (int) ($row->total ?? 0);
            }
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            WITH ranked AS (
                SELECT
                    p.id,
                    p.processo_id,
                    p.pcdp,
                    p.meio_transporte,
                    p.ida_origem_pais,
                    p.ida_origem_uf,
                    p.ida_origem_cidade,
                    p.ida_destino_pais,
                    p.ida_destino_uf,
                    p.ida_destino_cidade,
                    p.volta_origem_pais,
                    p.volta_origem_uf,
                    p.volta_origem_cidade,
                    p.volta_destino_pais,
                    p.volta_destino_uf,
                    p.volta_destino_cidade,
                    COALESCE(p.valor_passagem_cents, 0) AS valor_passagem_cents,
                    COALESCE(p.taxa_servico_cents, 0) AS taxa_servico_cents,
                    p.emissao_data,
                    p.emissao_hora,
                    p.ano,
                    p.imported_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY p.processo_id
                        ORDER BY p.emissao_data DESC NULLS LAST, p.id
                    ) AS rn
                FROM passagens p
                WHERE p.processo_id IN ({$placeholders})
            )
            SELECT *
            FROM ranked
            WHERE rn > ? AND rn <= ?
            ORDER BY processo_id, rn
        ";

        $rows = DB::select($sql, [...$ids, $offset, $offset + $limit]);
        foreach ($rows as $row) {
            $pid = (string) ($row->processo_id ?? '');
            if ($pid === '' || !isset($result[$pid])) {
                continue;
            }

            $node = (array) $row;
            unset($node['rn']);
            $result[$pid]['nodes'][] = $node;
        }

        return $result;
    }

    public function listPagamentosByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $batch = $this->batchPagamentosByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    public function batchPagamentosByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $ids = $this->normalizeProcessoIds($processoIds);
        if ($ids === []) {
            return [];
        }

        $result = $this->emptyBatchConnectionResult($ids);
        $totalRows = DB::table('pagamentos')
            ->selectRaw('processo_id, COUNT(*)::bigint AS total')
            ->whereIn('processo_id', $ids)
            ->groupBy('processo_id')
            ->get();

        foreach ($totalRows as $row) {
            $pid = (string) $row->processo_id;
            if (isset($result[$pid])) {
                $result[$pid]['total'] = (int) ($row->total ?? 0);
            }
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            WITH ranked AS (
                SELECT
                    p.id,
                    p.processo_id,
                    p.pcdp,
                    p.orgao_superior_codigo,
                    p.orgao_superior_nome,
                    p.orgao_pagador_codigo,
                    p.orgao_pagador_nome,
                    p.ug_pagadora_codigo,
                    p.ug_pagadora_nome,
                    p.tipo_pagamento,
                    COALESCE(p.valor_cents, 0) AS valor_cents,
                    p.ano,
                    p.imported_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY p.processo_id
                        ORDER BY p.ano DESC NULLS LAST, p.id
                    ) AS rn
                FROM pagamentos p
                WHERE p.processo_id IN ({$placeholders})
            )
            SELECT *
            FROM ranked
            WHERE rn > ? AND rn <= ?
            ORDER BY processo_id, rn
        ";

        $rows = DB::select($sql, [...$ids, $offset, $offset + $limit]);
        foreach ($rows as $row) {
            $pid = (string) ($row->processo_id ?? '');
            if ($pid === '' || !isset($result[$pid])) {
                continue;
            }

            $node = (array) $row;
            unset($node['rn']);
            $result[$pid]['nodes'][] = $node;
        }

        return $result;
    }

    public function listTrechosByProcessoId(string $processoId, int $limit, int $offset): array
    {
        $processoId = trim($processoId);
        if ($processoId === '') {
            return ['nodes' => [], 'total' => 0];
        }

        $batch = $this->batchTrechosByProcessoIds([$processoId], $limit, $offset);
        return $batch[$processoId] ?? ['nodes' => [], 'total' => 0];
    }

    public function batchTrechosByProcessoIds(array $processoIds, int $limit, int $offset): array
    {
        $ids = $this->normalizeProcessoIds($processoIds);
        if ($ids === []) {
            return [];
        }

        $result = $this->emptyBatchConnectionResult($ids);
        $totalRows = DB::table('trechos')
            ->selectRaw('processo_id, COUNT(*)::bigint AS total')
            ->whereIn('processo_id', $ids)
            ->groupBy('processo_id')
            ->get();

        foreach ($totalRows as $row) {
            $pid = (string) $row->processo_id;
            if (isset($result[$pid])) {
                $result[$pid]['total'] = (int) ($row->total ?? 0);
            }
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            WITH ranked AS (
                SELECT
                    t.id,
                    t.processo_id,
                    t.pcdp,
                    t.sequencia,
                    t.origem_data,
                    t.origem_pais,
                    t.origem_uf,
                    t.origem_cidade,
                    t.destino_data,
                    t.destino_pais,
                    t.destino_uf,
                    t.destino_cidade,
                    t.meio_transporte,
                    t.numero_diarias,
                    t.missao,
                    t.ano,
                    t.imported_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY t.processo_id
                        ORDER BY t.sequencia NULLS LAST, t.id
                    ) AS rn
                FROM trechos t
                WHERE t.processo_id IN ({$placeholders})
            )
            SELECT *
            FROM ranked
            WHERE rn > ? AND rn <= ?
            ORDER BY processo_id, rn
        ";

        $rows = DB::select($sql, [...$ids, $offset, $offset + $limit]);
        foreach ($rows as $row) {
            $pid = (string) ($row->processo_id ?? '');
            if ($pid === '' || !isset($result[$pid])) {
                continue;
            }

            $node = (array) $row;
            unset($node['rn']);
            $result[$pid]['nodes'][] = $node;
        }

        return $result;
    }

    /**
     * @param array<int,string> $politicoIds
     * @return array<string,array<int,string>>
     */
    private function loadNomesByPoliticoIds(array $politicoIds): array
    {
        $rows = DB::table('politicos')
            ->select(['id', 'nome_completo', 'nome_canonico', 'nome_busca'])
            ->whereIn(DB::raw('id::text'), $politicoIds)
            ->get();

        $out = [];
        foreach ($politicoIds as $politicoId) {
            $out[$politicoId] = [];
        }

        foreach ($rows as $row) {
            $id = (string) $row->id;
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

            $out[$id] = $this->expandNameVariants($baseNames);
        }

        return $out;
    }

    /**
     * @param Collection<int,string> $nomes
     * @return array<string,array<string,mixed>>
     */
    private function aggregateViagensByNome(Collection $nomes, ?int $anoInicio, ?int $anoFim): array
    {
        $query = DB::table('viagens')
            ->selectRaw('
                nome_viajante,
                COUNT(DISTINCT processo_id) AS total_viagens,
                COALESCE(SUM(valor_diarias_cents), 0) AS total_diarias_cents,
                COALESCE(SUM(valor_passagens_cents), 0) AS total_passagens_cents,
                COALESCE(SUM(valor_outros_gastos_cents), 0) AS total_outros_gastos_cents,
                COALESCE(SUM(valor_devolucao_cents), 0) AS total_devolucao_cents
            ')
            ->whereIn('nome_viajante', $nomes->all())
            ->groupBy('nome_viajante');

        if ($anoInicio !== null) {
            $query->where('ano', '>=', $anoInicio);
        }
        if ($anoFim !== null) {
            $query->where('ano', '<=', $anoFim);
        }

        return $query->get()
            ->mapWithKeys(static fn ($row): array => [
                (string) $row->nome_viajante => (array) $row,
            ])
            ->all();
    }

    /**
     * @param Collection<int,string> $nomes
     * @return array<string,array<string,mixed>>
     */
    private function aggregatePagamentosByNome(Collection $nomes, ?int $anoInicio, ?int $anoFim): array
    {
        $query = DB::table('viagens as v')
            ->selectRaw('
                v.nome_viajante,
                COALESCE(SUM(p.valor_cents), 0) AS total_pagamentos_cents
            ')
            ->join('pagamentos as p', 'p.processo_id', '=', 'v.processo_id')
            ->whereIn('v.nome_viajante', $nomes->all())
            ->groupBy('v.nome_viajante');

        if ($anoInicio !== null) {
            $query->where('v.ano', '>=', $anoInicio)
                ->where('p.ano', '>=', $anoInicio);
        }
        if ($anoFim !== null) {
            $query->where('v.ano', '<=', $anoFim)
                ->where('p.ano', '<=', $anoFim);
        }

        return $query->get()
            ->mapWithKeys(static fn ($row): array => [
                (string) $row->nome_viajante => (array) $row,
            ])
            ->all();
    }

    /**
     * @param Collection<int,string> $nomes
     * @return array<string,array<string,mixed>>
     */
    private function aggregateTrechosByNome(Collection $nomes, ?int $anoInicio, ?int $anoFim): array
    {
        $query = DB::table('viagens as v')
            ->selectRaw('
                v.nome_viajante,
                COUNT(t.id) AS total_trechos
            ')
            ->join('trechos as t', 't.processo_id', '=', 'v.processo_id')
            ->whereIn('v.nome_viajante', $nomes->all())
            ->groupBy('v.nome_viajante');

        if ($anoInicio !== null) {
            $query->where('v.ano', '>=', $anoInicio)
                ->where('t.ano', '>=', $anoInicio);
        }
        if ($anoFim !== null) {
            $query->where('v.ano', '<=', $anoFim)
                ->where('t.ano', '<=', $anoFim);
        }

        return $query->get()
            ->mapWithKeys(static fn ($row): array => [
                (string) $row->nome_viajante => (array) $row,
            ])
            ->all();
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function buildViagemProcessosBaseQuery(array $filtro): Builder
    {
        $query = DB::table('viagens as v')
            ->select('v.processo_id')
            ->whereRaw("NULLIF(BTRIM(v.nome_viajante), '') IS NOT NULL");

        $this->applyViagemRankingFiltro($query, $filtro);

        return $query->distinct();
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function buildViagemAggregateBaseQuery(array $filtro): Builder
    {
        $processosBase = $this->buildViagemProcessosBaseQuery($filtro);

        $pagamentos = DB::table('pagamentos as p')
            ->joinSub(clone $processosBase, 'vf', static function ($join): void {
                $join->on('vf.processo_id', '=', 'p.processo_id');
            })
            ->selectRaw('p.processo_id, COALESCE(SUM(p.valor_cents), 0)::bigint AS total_pagamentos_cents')
            ->groupBy('p.processo_id');

        if ($filtro['anoInicio'] !== null) {
            $pagamentos->where('p.ano', '>=', $filtro['anoInicio']);
        }
        if ($filtro['anoFim'] !== null) {
            $pagamentos->where('p.ano', '<=', $filtro['anoFim']);
        }

        $trechos = DB::table('trechos as t')
            ->joinSub(clone $processosBase, 'vf', static function ($join): void {
                $join->on('vf.processo_id', '=', 't.processo_id');
            })
            ->selectRaw('t.processo_id, COUNT(t.id)::bigint AS total_trechos')
            ->groupBy('t.processo_id');

        if ($filtro['anoInicio'] !== null) {
            $trechos->where('t.ano', '>=', $filtro['anoInicio']);
        }
        if ($filtro['anoFim'] !== null) {
            $trechos->where('t.ano', '<=', $filtro['anoFim']);
        }

        $query = DB::table('viagens as v')
            ->joinSub(clone $processosBase, 'vf', static function ($join): void {
                $join->on('vf.processo_id', '=', 'v.processo_id');
            })
            ->leftJoinSub($pagamentos, 'pag_agg', static function ($join): void {
                $join->on('pag_agg.processo_id', '=', 'v.processo_id');
            })
            ->leftJoinSub($trechos, 'tre_agg', static function ($join): void {
                $join->on('tre_agg.processo_id', '=', 'v.processo_id');
            })
            ->whereRaw("NULLIF(BTRIM(v.nome_viajante), '') IS NOT NULL");

        return $query;
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function buildViagemRankingQuery(array $filtro): Builder
    {
        $query = $this->buildViagemAggregateBaseQuery($filtro);

        return $query
            ->selectRaw("
                COALESCE(NULLIF(v.cpf_viajante, ''), NULLIF(BTRIM(v.nome_viajante), '')) AS viajante_key,
                NULLIF(v.cpf_viajante, '') AS cpf_viajante,
                v.nome_viajante,
                MAX(NULLIF(v.cargo, '')) AS cargo,
                MAX(NULLIF(v.funcao, '')) AS funcao,
                MAX(NULLIF(v.descricao_funcao, '')) AS descricao_funcao,
                COUNT(DISTINCT v.processo_id)::bigint AS total_viagens,
                COALESCE(SUM(COALESCE(tre_agg.total_trechos, 0)), 0)::bigint AS total_trechos,
                COALESCE(SUM(COALESCE(v.valor_diarias_cents, 0)), 0)::bigint AS total_diarias_cents,
                COALESCE(SUM(COALESCE(v.valor_passagens_cents, 0)), 0)::bigint AS total_passagens_cents,
                COALESCE(SUM(COALESCE(v.valor_outros_gastos_cents, 0)), 0)::bigint AS total_outros_gastos_cents,
                COALESCE(SUM(COALESCE(v.valor_devolucao_cents, 0)), 0)::bigint AS total_devolucao_cents,
                COALESCE(SUM(COALESCE(pag_agg.total_pagamentos_cents, 0)), 0)::bigint AS total_pagamentos_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                ), 0)::bigint AS total_gasto_bruto_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                    - COALESCE(v.valor_devolucao_cents, 0)
                ), 0)::bigint AS total_gasto_liquido_cents
            ")
            ->groupByRaw("
                COALESCE(NULLIF(v.cpf_viajante, ''), NULLIF(BTRIM(v.nome_viajante), '')),
                NULLIF(v.cpf_viajante, ''),
                v.nome_viajante
            ");
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function buildViagemOrgaoRankingQuery(array $filtro, string $codigoColumn, string $nomeColumn): Builder
    {
        $query = $this->buildViagemAggregateBaseQuery($filtro)
            ->whereRaw("COALESCE(NULLIF({$codigoColumn}, ''), NULLIF(BTRIM({$nomeColumn}), '')) IS NOT NULL");

        return $query
            ->selectRaw("
                COALESCE(NULLIF({$codigoColumn}, ''), NULLIF(BTRIM({$nomeColumn}), '')) AS orgao_key,
                NULLIF({$codigoColumn}, '') AS codigo_orgao,
                MAX(NULLIF({$nomeColumn}, '')) AS nome_orgao,
                COUNT(DISTINCT v.processo_id)::bigint AS total_viagens,
                COUNT(DISTINCT COALESCE(NULLIF(v.cpf_viajante, ''), NULLIF(BTRIM(v.nome_viajante), '')))::bigint AS total_viajantes,
                COALESCE(SUM(COALESCE(tre_agg.total_trechos, 0)), 0)::bigint AS total_trechos,
                COALESCE(SUM(COALESCE(v.valor_diarias_cents, 0)), 0)::bigint AS total_diarias_cents,
                COALESCE(SUM(COALESCE(v.valor_passagens_cents, 0)), 0)::bigint AS total_passagens_cents,
                COALESCE(SUM(COALESCE(v.valor_outros_gastos_cents, 0)), 0)::bigint AS total_outros_gastos_cents,
                COALESCE(SUM(COALESCE(v.valor_devolucao_cents, 0)), 0)::bigint AS total_devolucao_cents,
                COALESCE(SUM(COALESCE(pag_agg.total_pagamentos_cents, 0)), 0)::bigint AS total_pagamentos_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                ), 0)::bigint AS total_gasto_bruto_cents,
                COALESCE(SUM(
                    COALESCE(v.valor_diarias_cents, 0)
                    + COALESCE(v.valor_passagens_cents, 0)
                    + COALESCE(v.valor_outros_gastos_cents, 0)
                    - COALESCE(v.valor_devolucao_cents, 0)
                ), 0)::bigint AS total_gasto_liquido_cents
            ")
            ->groupByRaw("
                COALESCE(NULLIF({$codigoColumn}, ''), NULLIF(BTRIM({$nomeColumn}), '')),
                NULLIF({$codigoColumn}, '')
            ");
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function applyViagemRankingFiltro(Builder $query, array $filtro): void
    {
        $this->applyViagemBaseFiltro($query, $filtro);

        if ($filtro['cargoParlamentar'] !== null) {
            $this->applyViagemCargoParlamentarFiltro($query, $filtro, $filtro['cargoParlamentar']);
            return;
        }

        if (($filtro['apenasParlamentares'] ?? null) === true) {
            $this->applyViagemParlamentaresOnlyFiltro($query, $filtro);
        }
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function applyViagemBaseFiltro(Builder $query, array $filtro): void
    {
        if ($filtro['anoInicio'] !== null) {
            $query->where('v.ano', '>=', $filtro['anoInicio']);
        }
        if ($filtro['anoFim'] !== null) {
            $query->where('v.ano', '<=', $filtro['anoFim']);
        }
        if ($filtro['orgaoSuperiorCodigo'] !== null) {
            $query->where('v.orgao_superior_codigo', $filtro['orgaoSuperiorCodigo']);
        }
        if ($filtro['orgaoSolicitanteCodigo'] !== null) {
            $query->where('v.orgao_solicitante_codigo', $filtro['orgaoSolicitanteCodigo']);
        }
        if ($filtro['processoId'] !== null) {
            $query->where('v.processo_id', $filtro['processoId']);
        }
        if ($filtro['pcdp'] !== null) {
            $query->where('v.pcdp', $filtro['pcdp']);
        }
        if ($filtro['cpfViajante'] !== null) {
            $query->where('v.cpf_viajante', $filtro['cpfViajante']);
        }
        if ($filtro['nomeViajante'] !== null) {
            $query->where('v.nome_viajante', 'ILIKE', '%' . $filtro['nomeViajante'] . '%');
        }
        if ($filtro['cargo'] !== null) {
            $query->where('v.cargo', 'ILIKE', '%' . $filtro['cargo'] . '%');
        }
        if ($filtro['funcao'] !== null) {
            $query->where(function (Builder $nested) use ($filtro): void {
                $term = '%' . $filtro['funcao'] . '%';
                $nested
                    ->where('v.funcao', 'ILIKE', $term)
                    ->orWhere('v.descricao_funcao', 'ILIKE', $term);
            });
        }
        if ($filtro['destino'] !== null) {
            $query->where('v.destinos', 'ILIKE', '%' . $filtro['destino'] . '%');
        }
        if ($filtro['motivo'] !== null) {
            $query->where('v.motivo', 'ILIKE', '%' . $filtro['motivo'] . '%');
        }
        if ($filtro['situacao'] !== null) {
            $query->where('v.situacao', 'ILIKE', '%' . $filtro['situacao'] . '%');
        }
        if ($filtro['search'] !== null) {
            $query->where(function (Builder $nested) use ($filtro): void {
                $term = '%' . $filtro['search'] . '%';
                $nested
                    ->where('v.nome_viajante', 'ILIKE', $term)
                    ->orWhere('v.cargo', 'ILIKE', $term)
                    ->orWhere('v.funcao', 'ILIKE', $term)
                    ->orWhere('v.descricao_funcao', 'ILIKE', $term)
                    ->orWhere('v.orgao_superior_nome', 'ILIKE', $term)
                    ->orWhere('v.orgao_solicitante_nome', 'ILIKE', $term)
                    ->orWhere('v.destinos', 'ILIKE', $term)
                    ->orWhere('v.motivo', 'ILIKE', $term);
            });
        }
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function applyViagemParlamentaresOnlyFiltro(Builder $query, array $filtro): void
    {
        $nomes = $this->loadParlamentarNomeVariants();
        if ($this->hasViagemNameMatch($filtro, $nomes)) {
            $query->whereIn('v.nome_viajante', $nomes);
            return;
        }

        $query->where(function (Builder $nested): void {
            $nested
                ->whereRaw("COALESCE(v.cargo, '') ILIKE '%deputad%'")
                ->orWhereRaw("COALESCE(v.cargo, '') ILIKE '%senador%'")
                ->orWhereRaw("COALESCE(v.funcao, '') ILIKE '%deputad%'")
                ->orWhereRaw("COALESCE(v.funcao, '') ILIKE '%senador%'")
                ->orWhereRaw("COALESCE(v.descricao_funcao, '') ILIKE '%deputad%'")
                ->orWhereRaw("COALESCE(v.descricao_funcao, '') ILIKE '%senador%'");
        });
    }

    /**
     * @param array<string,mixed> $filtro
     */
    private function applyViagemCargoParlamentarFiltro(Builder $query, array $filtro, string $cargoParlamentar): void
    {
        $nomes = $this->loadParlamentarNomeVariants($cargoParlamentar);
        if ($this->hasViagemNameMatch($filtro, $nomes)) {
            $query->whereIn('v.nome_viajante', $nomes);
            return;
        }

        $isSenador = $cargoParlamentar === 'SENADOR';
        $cargoLike = $isSenador ? '%senador%' : '%deputad%';

        $query->where(function (Builder $nested) use ($cargoLike): void {
            $nested
                ->whereRaw("COALESCE(v.cargo, '') ILIKE ?", [$cargoLike])
                ->orWhereRaw("COALESCE(v.funcao, '') ILIKE ?", [$cargoLike])
                ->orWhereRaw("COALESCE(v.descricao_funcao, '') ILIKE ?", [$cargoLike]);
        });
    }

    /**
     * @param array<string,mixed> $filtro
     * @param array<int,string> $nomes
     */
    private function hasViagemNameMatch(array $filtro, array $nomes): bool
    {
        if ($nomes === []) {
            return false;
        }

        $probe = DB::table('viagens as v')
            ->selectRaw('1')
            ->whereRaw("NULLIF(BTRIM(v.nome_viajante), '') IS NOT NULL");

        $this->applyViagemBaseFiltro($probe, $filtro);

        return $probe
            ->whereIn('v.nome_viajante', $nomes)
            ->limit(1)
            ->exists();
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function mapViagemRankingRow(object $row): array
    {
        return [
            'cpf_viajante' => $row->cpf_viajante ?? null,
            'nome_viajante' => $row->nome_viajante ?? null,
            'cargo' => $row->cargo ?? null,
            'funcao' => $row->funcao ?? null,
            'descricao_funcao' => $row->descricao_funcao ?? null,
            'total_viagens' => (int) ($row->total_viagens ?? 0),
            'total_trechos' => (int) ($row->total_trechos ?? 0),
            'total_diarias_cents' => $row->total_diarias_cents ?? '0',
            'total_passagens_cents' => $row->total_passagens_cents ?? '0',
            'total_pagamentos_cents' => $row->total_pagamentos_cents ?? '0',
            'total_outros_gastos_cents' => $row->total_outros_gastos_cents ?? '0',
            'total_devolucao_cents' => $row->total_devolucao_cents ?? '0',
            'total_gasto_bruto_cents' => $row->total_gasto_bruto_cents ?? '0',
            'total_gasto_liquido_cents' => $row->total_gasto_liquido_cents ?? '0',
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function mapViagemOrgaoRankingRow(object $row): array
    {
        return [
            'codigo_orgao' => $row->codigo_orgao ?? null,
            'nome_orgao' => $row->nome_orgao ?? null,
            'total_viagens' => (int) ($row->total_viagens ?? 0),
            'total_viajantes' => (int) ($row->total_viajantes ?? 0),
            'total_trechos' => (int) ($row->total_trechos ?? 0),
            'total_diarias_cents' => $row->total_diarias_cents ?? '0',
            'total_passagens_cents' => $row->total_passagens_cents ?? '0',
            'total_pagamentos_cents' => $row->total_pagamentos_cents ?? '0',
            'total_outros_gastos_cents' => $row->total_outros_gastos_cents ?? '0',
            'total_devolucao_cents' => $row->total_devolucao_cents ?? '0',
            'total_gasto_bruto_cents' => $row->total_gasto_bruto_cents ?? '0',
            'total_gasto_liquido_cents' => $row->total_gasto_liquido_cents ?? '0',
        ];
    }

    /**
     * @return array<int,string>
     */
    private function loadParlamentarNomeVariants(?string $cargoParlamentar = null): array
    {
        $cacheKey = $cargoParlamentar ?? '*';
        if (isset(self::$parlamentarNomeVariantsCache[$cacheKey])) {
            return self::$parlamentarNomeVariantsCache[$cacheKey];
        }

        $query = DB::table('politicos')
            ->select(['nome_completo', 'nome_canonico', 'nome_busca', 'cargo_atual'])
            ->where(function (Builder $nested): void {
                $nested
                    ->whereRaw("COALESCE(cargo_atual, '') ILIKE '%deputad%'")
                    ->orWhereRaw("COALESCE(cargo_atual, '') ILIKE '%senador%'");
            });

        if ($cargoParlamentar === 'DEPUTADO') {
            $query->whereRaw("COALESCE(cargo_atual, '') ILIKE '%deputad%'");
        } elseif ($cargoParlamentar === 'SENADOR') {
            $query->whereRaw("COALESCE(cargo_atual, '') ILIKE '%senador%'");
        }

        $rows = $query->get();
        $baseNames = [];

        foreach ($rows as $row) {
            foreach ([$row->nome_completo, $row->nome_canonico, $row->nome_busca] as $name) {
                if (!is_string($name) || trim($name) === '') {
                    continue;
                }

                $normalized = $this->normalizeName($name);
                if ($normalized !== '') {
                    $baseNames[$normalized] = $normalized;
                }
            }
        }

        self::$parlamentarNomeVariantsCache[$cacheKey] = $this->expandNameVariants(array_values($baseNames));

        return self::$parlamentarNomeVariantsCache[$cacheKey];
    }

    /**
     * @param array<int,string> $politicoIds
     * @return array<string,array<string,mixed>>
     */
    private function emptySummaries(array $politicoIds, ?int $anoInicio, ?int $anoFim): array
    {
        $out = [];
        foreach ($politicoIds as $politicoId) {
            $out[$politicoId] = [
                'totalViagens' => 0,
                'totalTrechos' => 0,
                'totalDiariasCents' => 0,
                'totalPassagensCents' => 0,
                'totalPagamentosCents' => 0,
                'totalOutrosGastosCents' => 0,
                'totalDevolucaoCents' => 0,
                'periodo' => [
                    'anoInicio' => $anoInicio,
                    'anoFim' => $anoFim,
                ],
            ];
        }

        return $out;
    }

    /**
     * @param array{anoInicio?:int|null,anoFim?:int|null} $periodo
     * @return array{0:int|null,1:int|null}
     */
    private function normalizePeriodo(array $periodo): array
    {
        $from = isset($periodo['anoInicio']) ? (int) $periodo['anoInicio'] : null;
        $to = isset($periodo['anoFim']) ? (int) $periodo['anoFim'] : null;

        if ($from !== null && $to !== null && $from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [$from, $to];
    }

    /**
     * @param array<string,mixed> $filtro
     * @return array<string,mixed>
     */
    private function normalizeRankingFiltro(array $filtro): array
    {
        [$from, $to] = $this->normalizePeriodo($filtro);
        $orgaoSuperiorCodigo = isset($filtro['orgaoSuperiorCodigo']) ? trim((string) $filtro['orgaoSuperiorCodigo']) : null;
        $orgaoSolicitanteCodigo = isset($filtro['orgaoSolicitanteCodigo']) ? trim((string) $filtro['orgaoSolicitanteCodigo']) : null;
        $search = isset($filtro['search']) ? trim((string) $filtro['search']) : null;
        $situacao = isset($filtro['situacao']) ? trim((string) $filtro['situacao']) : null;
        $processoId = isset($filtro['processoId']) ? trim((string) $filtro['processoId']) : null;
        $pcdp = isset($filtro['pcdp']) ? trim((string) $filtro['pcdp']) : null;
        $cpfViajante = isset($filtro['cpfViajante']) ? trim((string) $filtro['cpfViajante']) : null;
        $nomeViajante = isset($filtro['nomeViajante']) ? trim((string) $filtro['nomeViajante']) : null;
        $cargo = isset($filtro['cargo']) ? trim((string) $filtro['cargo']) : null;
        $funcao = isset($filtro['funcao']) ? trim((string) $filtro['funcao']) : null;
        $destino = isset($filtro['destino']) ? trim((string) $filtro['destino']) : null;
        $motivo = isset($filtro['motivo']) ? trim((string) $filtro['motivo']) : null;
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
     * @param array<int,string> $processoIds
     * @return array<int,string>
     */
    private function normalizeProcessoIds(array $processoIds): array
    {
        $ids = [];
        foreach ($processoIds as $processoId) {
            $value = trim((string) $processoId);
            if ($value === '') {
                continue;
            }
            $ids[$value] = $value;
        }

        return array_values($ids);
    }

    /**
     * @param array<int,string> $processoIds
     * @return array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    private function emptyBatchConnectionResult(array $processoIds): array
    {
        $result = [];
        foreach ($processoIds as $processoId) {
            $result[$processoId] = [
                'nodes' => [],
                'total' => 0,
            ];
        }

        return $result;
    }
}
