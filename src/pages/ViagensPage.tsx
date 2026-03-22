import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import TopGastadoresCard from "@/components/viagens/TopGastadoresCard";
import TopOrgaosCard from "@/components/viagens/TopOrgaosCard";
import TopViajantesCard from "@/components/viagens/TopViajantesCard";
import ViagemDetailDrawer from "@/components/viagens/ViagemDetailDrawer";
import ViagensFilters, { type ViagensFilterState } from "@/components/viagens/ViagensFilters";
import ViagensKpis from "@/components/viagens/ViagensKpis";
import ViagensTable, { type ViagensSortKey } from "@/components/viagens/ViagensTable";
import { normalizePagination } from "@/hooks/queryShared";
import { useDetalheViagem } from "@/hooks/useDetalheViagem";
import { useResumoViagens } from "@/hooks/useResumoViagens";
import { useTopGastadoresViagens } from "@/hooks/useTopGastadoresViagens";
import { useTopOrgaosSolicitantesViagens } from "@/hooks/useTopOrgaosSolicitantesViagens";
import { useTopOrgaosSuperioresViagens } from "@/hooks/useTopOrgaosSuperioresViagens";
import { useTopViajantes } from "@/hooks/useTopViajantes";
import { useViagensPainel } from "@/hooks/useViagensPainel";
import type { RankingViagemFiltroInput, Viagem } from "@/api/types";
import { formatCents, formatCentsCompact, formatCountCompact, toBigInt } from "@/lib/formatters";
import {
  fetchViagensPainel,
  normalizeViagensFilter,
} from "@/services/viagensService";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = CURRENT_YEAR - 1;
const TABLE_LIMIT = 20;
const RANKING_LIMIT = 5;
const DEFAULT_SORT: ViagensSortKey = "data_desc";
const VIAGENS_STORAGE_KEY = "radar:viagens:state";

const DEFAULT_FILTERS: ViagensFilterState = {
  anoInicio: DEFAULT_YEAR,
  anoFim: DEFAULT_YEAR,
  orgaoSuperiorCodigo: "",
  orgaoSolicitanteCodigo: "",
  search: "",
  situacao: "",
  processoId: "",
  pcdp: "",
  cpfViajante: "",
  nomeViajante: "",
  cargo: "",
  funcao: "",
  destino: "",
  motivo: "",
};

function parseYear(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2019 && parsed <= CURRENT_YEAR ? parsed : fallback;
}

function parsePage(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeStoredText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function buildFilterState(storedFilters: unknown): ViagensFilterState {
  const raw =
    storedFilters && typeof storedFilters === "object"
      ? (storedFilters as Record<string, unknown>)
      : {};
  const anoInicio = parseYear(raw.anoInicio as string | null, DEFAULT_FILTERS.anoInicio);
  const anoFim = parseYear(raw.anoFim as string | null, DEFAULT_FILTERS.anoFim);

  return {
    anoInicio: Math.min(anoInicio, anoFim),
    anoFim: Math.max(anoInicio, anoFim),
    orgaoSuperiorCodigo: normalizeStoredText(raw.orgaoSuperiorCodigo),
    orgaoSolicitanteCodigo: normalizeStoredText(raw.orgaoSolicitanteCodigo),
    search: normalizeStoredText(raw.search),
    situacao: normalizeStoredText(raw.situacao),
    processoId: normalizeStoredText(raw.processoId),
    pcdp: normalizeStoredText(raw.pcdp),
    cpfViajante: normalizeStoredText(raw.cpfViajante),
    nomeViajante: normalizeStoredText(raw.nomeViajante),
    cargo: normalizeStoredText(raw.cargo),
    funcao: normalizeStoredText(raw.funcao),
    destino: normalizeStoredText(raw.destino),
    motivo: normalizeStoredText(raw.motivo),
  };
}

function readStoredViagensState(): { filters: ViagensFilterState; page: number } {
  if (typeof window === "undefined") {
    return { filters: DEFAULT_FILTERS, page: 1 };
  }

  try {
    const raw = window.sessionStorage.getItem(VIAGENS_STORAGE_KEY);
    if (!raw) {
      return { filters: DEFAULT_FILTERS, page: 1 };
    }

    const parsed = JSON.parse(raw) as {
      filters?: unknown;
      page?: unknown;
    };

    return {
      filters: buildFilterState(parsed.filters),
      page: parsePage(parsed.page),
    };
  } catch {
    return { filters: DEFAULT_FILTERS, page: 1 };
  }
}

const ViagensPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ViagensFilterState>(() => readStoredViagensState().filters);
  const [currentPage, setCurrentPage] = useState<number>(() => readStoredViagensState().page);
  const [sortBy, setSortBy] = useState<ViagensSortKey>(DEFAULT_SORT);
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [peopleRankingsReady, setPeopleRankingsReady] = useState(false);
  const [orgaoRankingsReady, setOrgaoRankingsReady] = useState(false);
  const [summaryComplementReady, setSummaryComplementReady] = useState(false);
  const offset = (currentPage - 1) * TABLE_LIMIT;

  const apiFilter = useMemo<RankingViagemFiltroInput>(
    () => ({
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      orgaoSuperiorCodigo: filters.orgaoSuperiorCodigo,
      orgaoSolicitanteCodigo: filters.orgaoSolicitanteCodigo,
      search: filters.search,
      situacao: filters.situacao,
      processoId: filters.processoId,
      pcdp: filters.pcdp,
      cpfViajante: filters.cpfViajante,
      nomeViajante: filters.nomeViajante,
      cargo: filters.cargo,
      funcao: filters.funcao,
      destino: filters.destino,
      motivo: filters.motivo,
      apenasParlamentares: false,
      cargoParlamentar: undefined,
    }),
    [filters]
  );

  const rankingPagination = useMemo(() => ({ limit: RANKING_LIMIT, offset: 0 }), []);
  const tablePagination = useMemo(() => ({ limit: TABLE_LIMIT, offset }), [offset]);
  const normalizedFilter = useMemo(() => normalizeViagensFilter(apiFilter), [apiFilter]);

  const resumoCoreQuery = useResumoViagens(apiFilter, {
    includePagamentos: false,
    includeTrechos: false,
  });
  const viagensPainelQuery = useViagensPainel(apiFilter, tablePagination, {
    includeTotal: false,
  });
  const topViajantesQuery = useTopViajantes(apiFilter, rankingPagination, {
    enabled: peopleRankingsReady,
  });
  const topGastadoresQuery = useTopGastadoresViagens(apiFilter, rankingPagination, {
    enabled: peopleRankingsReady,
  });
  const topOrgaosSuperioresQuery = useTopOrgaosSuperioresViagens(apiFilter, rankingPagination, {
    enabled: orgaoRankingsReady,
  });
  const topOrgaosSolicitantesQuery = useTopOrgaosSolicitantesViagens(
    apiFilter,
    rankingPagination,
    {
      enabled: orgaoRankingsReady,
    }
  );
  const resumoComplementoQuery = useResumoViagens(apiFilter, {
    enabled: summaryComplementReady,
    includePagamentos: true,
    includeTrechos: true,
  });
  const detalheQuery = useDetalheViagem(
    selectedViagem
      ? {
          processoId: selectedViagem.processoId || "",
          pcdp: selectedViagem.pcdp,
          cpfViajante: selectedViagem.cpfViajante,
          nomeViajante: selectedViagem.nomeViajante,
          anoInicio: filters.anoInicio,
          anoFim: filters.anoFim,
        }
      : undefined,
    Boolean(selectedViagem)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      VIAGENS_STORAGE_KEY,
      JSON.stringify({
        filters,
        page: currentPage,
      })
    );
  }, [currentPage, filters]);

  useEffect(() => {
    setPeopleRankingsReady(false);
    setOrgaoRankingsReady(false);
    setSummaryComplementReady(false);
  }, [
    filters.anoInicio,
    filters.anoFim,
    filters.orgaoSuperiorCodigo,
    filters.orgaoSolicitanteCodigo,
    filters.search,
    filters.situacao,
    filters.processoId,
    filters.pcdp,
    filters.cpfViajante,
    filters.nomeViajante,
    filters.cargo,
    filters.funcao,
    filters.destino,
    filters.motivo,
  ]);

  const baseWaveSettled = !resumoCoreQuery.isFetching && !viagensPainelQuery.isFetching;
  const peopleWaveSettled =
    peopleRankingsReady && !topViajantesQuery.isFetching && !topGastadoresQuery.isFetching;
  const orgaoWaveSettled =
    orgaoRankingsReady &&
    !topOrgaosSuperioresQuery.isFetching &&
    !topOrgaosSolicitantesQuery.isFetching;

  useEffect(() => {
    if (baseWaveSettled && !peopleRankingsReady) {
      setPeopleRankingsReady(true);
    }
  }, [baseWaveSettled, peopleRankingsReady]);

  useEffect(() => {
    if (peopleWaveSettled && !orgaoRankingsReady) {
      setOrgaoRankingsReady(true);
    }
  }, [orgaoRankingsReady, peopleWaveSettled]);

  useEffect(() => {
    if (orgaoWaveSettled && !summaryComplementReady) {
      setSummaryComplementReady(true);
    }
  }, [orgaoWaveSettled, summaryComplementReady]);

  useEffect(() => {
    setSelectedViagem(null);
  }, [
    filters.anoInicio,
    filters.anoFim,
    filters.orgaoSuperiorCodigo,
    filters.orgaoSolicitanteCodigo,
    filters.search,
    filters.situacao,
    filters.processoId,
    filters.pcdp,
    filters.cpfViajante,
    filters.nomeViajante,
    filters.cargo,
    filters.funcao,
    filters.destino,
    filters.motivo,
    currentPage,
  ]);

  useEffect(() => {
    const data = viagensPainelQuery.data;
    if (!data) return;

    const nextOffset = data.offset + data.limit;
    const totalForPrefetch =
      data.total > 0 ? data.total : resumoCoreQuery.data?.totalViagens ?? 0;
    if (nextOffset >= totalForPrefetch) return;

    const nextPagination = normalizePagination(
      { limit: data.limit, offset: nextOffset },
      TABLE_LIMIT
    );

    queryClient.prefetchQuery({
      queryKey: ["viagens-painel", normalizedFilter, nextPagination, false],
      queryFn: ({ signal }) =>
        fetchViagensPainel(normalizedFilter, nextPagination, { signal, includeTotal: false }),
      staleTime: 60_000,
    });
  }, [normalizedFilter, queryClient, resumoCoreQuery.data?.totalViagens, viagensPainelQuery.data]);

  const resumoData = useMemo(
    () =>
      resumoComplementoQuery.data
        ? {
            ...resumoCoreQuery.data,
            ...resumoComplementoQuery.data,
          }
        : resumoCoreQuery.data,
    [resumoComplementoQuery.data, resumoCoreQuery.data]
  );

  const totalViagensPainel = resumoData?.totalViagens ?? viagensPainelQuery.data?.total ?? 0;
  const viagensTableData = useMemo(() => {
    if (!viagensPainelQuery.data) {
      return undefined;
    }

    if (viagensPainelQuery.data.total > 0 || totalViagensPainel <= 0) {
      return viagensPainelQuery.data;
    }

    return {
      ...viagensPainelQuery.data,
      total: totalViagensPainel,
    };
  }, [totalViagensPainel, viagensPainelQuery.data]);

  const updateFilters = (patch: Partial<ViagensFilterState>) => {
    const next: ViagensFilterState = {
      ...filters,
      ...patch,
    };

    if (patch.anoInicio !== undefined && next.anoInicio > next.anoFim) {
      next.anoFim = next.anoInicio;
    }
    if (patch.anoFim !== undefined && next.anoFim < next.anoInicio) {
      next.anoInicio = next.anoFim;
    }

    setFilters(next);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSortBy(DEFAULT_SORT);
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handlePageChange = (nextOffset: number) => {
    setCurrentPage(Math.floor(nextOffset / TABLE_LIMIT) + 1);
  };

  const selectedTotal =
    viagensPainelQuery.data?.nodes.reduce((acc, item) => {
      const bruto =
        toBigInt(item.valorDiariasCents) +
        toBigInt(item.valorPassagensCents) +
        toBigInt(item.valorOutrosGastosCents) -
        toBigInt(item.valorDevolucaoCents);

      return acc + (bruto > 0n ? bruto : 0n);
    }, 0n) || 0n;
  const activeFilterCount = [
    filters.orgaoSuperiorCodigo,
    filters.orgaoSolicitanteCodigo,
    filters.search,
    filters.situacao,
    filters.processoId,
    filters.pcdp,
    filters.cpfViajante,
    filters.nomeViajante,
    filters.cargo,
    filters.funcao,
    filters.destino,
    filters.motivo,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen overflow-x-hidden lg:ml-72">
        <div className="w-full px-3 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-6 lg:pt-10 xl:px-8 2xl:px-10">
          <section className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,248,255,0.9))] p-5 shadow-elevated backdrop-blur-sm sm:rounded-[34px] sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="min-w-0 space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Plane className="h-3.5 w-3.5" />
                  Area de viagens
                </p>

                <div className="space-y-3">
                  <h1 className="max-w-4xl text-2xl font-extrabold leading-tight text-foreground sm:text-4xl">
                    Viagens oficiais
                    <span className="mt-1 block bg-gradient-to-r from-foreground via-primary to-sky-500 bg-clip-text text-transparent">
                      em foco, com leitura clara e gasto sob medida
                    </span>
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    Um painel direto para acompanhar quem viajou, quanto foi gasto e quais orgaos
                    concentraram mais despesas no periodo escolhido, sem poluir a leitura.
                  </p>
                </div>

                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    dados oficiais consolidados
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                    leitura amigavel para mobile
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                    detalhe por processo
                  </span>
                </div>
              </div>

              <div className="min-w-0 grid grid-cols-2 gap-3 sm:gap-4">
                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Periodo
                  </p>
                  <p className="mt-3 text-lg font-extrabold text-foreground sm:text-2xl">
                    {filters.anoInicio} - {filters.anoFim}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Aplicado em toda a pagina
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Filtros ativos
                  </p>
                  <p className="mt-3 text-lg font-extrabold text-foreground sm:text-2xl">
                    {activeFilterCount ? formatCountCompact(activeFilterCount) : "Nenhum"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {activeFilterCount
                      ? `${activeFilterCount.toLocaleString("pt-BR")} refinamentos alem do periodo`
                      : "Somente periodo e busca ampla"}
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Viagens no recorte
                  </p>
                  <p className="mt-3 text-lg font-extrabold text-foreground sm:text-2xl">
                    {formatCountCompact(totalViagensPainel)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {totalViagensPainel.toLocaleString("pt-BR")} viagens encontradas
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Soma da pagina
                  </p>
                  <p className="mt-3 text-lg font-extrabold text-foreground sm:text-2xl">
                    {formatCentsCompact(selectedTotal.toString())}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCents(selectedTotal.toString())}
                  </p>
                </article>
              </div>
            </div>
          </section>

          <div className="mt-6 space-y-6">
            <ViagensFilters value={filters} onChange={updateFilters} onReset={handleReset} />

            <ViagensKpis
              data={resumoData}
              isLoading={resumoCoreQuery.isLoading}
              isComplementLoading={!summaryComplementReady || resumoComplementoQuery.isFetching}
              error={(resumoCoreQuery.error as Error | null) || null}
              onRetry={() => {
                void resumoCoreQuery.refetch();
                if (summaryComplementReady) {
                  void resumoComplementoQuery.refetch();
                }
              }}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TopGastadoresCard
                data={topGastadoresQuery.data}
                isLoading={topGastadoresQuery.isLoading}
                error={(topGastadoresQuery.error as Error | null) || null}
                onRetry={() => void topGastadoresQuery.refetch()}
              />
              <TopViajantesCard
                data={topViajantesQuery.data}
                isLoading={topViajantesQuery.isLoading}
                error={(topViajantesQuery.error as Error | null) || null}
                onRetry={() => void topViajantesQuery.refetch()}
              />
              <TopOrgaosCard
                title="Top orgaos superiores"
                description="Quem mais concentrou viagens pelo orgao superior"
                data={topOrgaosSuperioresQuery.data}
                isLoading={topOrgaosSuperioresQuery.isLoading}
                error={(topOrgaosSuperioresQuery.error as Error | null) || null}
                onRetry={() => void topOrgaosSuperioresQuery.refetch()}
              />
              <TopOrgaosCard
                title="Top orgaos solicitantes"
                description="Orgaos solicitantes com maior gasto liquido"
                data={topOrgaosSolicitantesQuery.data}
                isLoading={topOrgaosSolicitantesQuery.isLoading}
                error={(topOrgaosSolicitantesQuery.error as Error | null) || null}
                onRetry={() => void topOrgaosSolicitantesQuery.refetch()}
              />
            </section>

            <section className="min-w-0">
              <ViagensTable
                data={viagensTableData}
                isLoading={viagensPainelQuery.isLoading}
                error={(viagensPainelQuery.error as Error | null) || null}
                onRetry={() => void viagensPainelQuery.refetch()}
                onOpenDetail={setSelectedViagem}
                selectedProcessoId={selectedViagem?.processoId}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onPageChange={handlePageChange}
              />
            </section>
          </div>
        </div>
      </main>

      <ViagemDetailDrawer
        open={Boolean(selectedViagem)}
        onOpenChange={(open) => {
          if (!open) setSelectedViagem(null);
        }}
        viagemBase={selectedViagem}
        detail={detalheQuery.data}
        isLoading={detalheQuery.isLoading}
        error={(detalheQuery.error as Error | null) || null}
        onRetry={() => void detalheQuery.refetch()}
      />
    </div>
  );
};

export default ViagensPage;
