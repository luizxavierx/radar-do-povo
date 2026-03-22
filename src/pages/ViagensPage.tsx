import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Wallet } from "lucide-react";

import type { RankingViagemFiltroInput, Viagem } from "@/api/types";
import AppSidebar from "@/components/AppSidebar";
import ViagemDetailDrawer from "@/components/viagens/ViagemDetailDrawer";
import ViagensAnalyticsDeck from "@/components/viagens/ViagensAnalyticsDeck";
import ViagensFilters, { type ViagensFilterState } from "@/components/viagens/ViagensFilters";
import ViagensKpis from "@/components/viagens/ViagensKpis";
import ViagensTable, { type ViagensSortKey } from "@/components/viagens/ViagensTable";
import { type PaginationDensity } from "@/components/PaginationControls";
import { normalizePagination } from "@/hooks/queryShared";
import { useDetalheViagem } from "@/hooks/useDetalheViagem";
import { useResumoViagens } from "@/hooks/useResumoViagens";
import { useTopGastadoresViagens } from "@/hooks/useTopGastadoresViagens";
import { useTopOrgaosSolicitantesViagens } from "@/hooks/useTopOrgaosSolicitantesViagens";
import { useTopOrgaosSuperioresViagens } from "@/hooks/useTopOrgaosSuperioresViagens";
import { useTopViajantes } from "@/hooks/useTopViajantes";
import { useViagensPainel } from "@/hooks/useViagensPainel";
import { formatCents, formatCentsCompact, formatCountCompact } from "@/lib/formatters";
import { fetchViagensPainel, normalizeViagensFilter } from "@/services/viagensService";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = CURRENT_YEAR - 1;
const DEFAULT_TABLE_LIMIT = 20;
const TABLE_LIMIT_OPTIONS = [20, 40, 60];
const RANKING_LIMIT = 5;
const DEFAULT_SORT: ViagensSortKey = "data_desc";
const DEFAULT_DENSITY: PaginationDensity = "comfortable";
const VIAGENS_STORAGE_KEY = "radar:viagens:state";
const VIAGENS_SAVED_VIEW_KEY = "radar:viagens:saved-view";

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

function parseTableLimit(value: unknown) {
  const parsed = Number(value);
  return TABLE_LIMIT_OPTIONS.includes(parsed) ? parsed : DEFAULT_TABLE_LIMIT;
}

function parseDensity(value: unknown): PaginationDensity {
  return value === "compact" ? "compact" : DEFAULT_DENSITY;
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

function readStoredViagensState(): {
  filters: ViagensFilterState;
  page: number;
  pageSize: number;
  density: PaginationDensity;
} {
  if (typeof window === "undefined") {
    return { filters: DEFAULT_FILTERS, page: 1, pageSize: DEFAULT_TABLE_LIMIT, density: DEFAULT_DENSITY };
  }

  try {
    const raw = window.sessionStorage.getItem(VIAGENS_STORAGE_KEY);
    if (!raw) {
      return { filters: DEFAULT_FILTERS, page: 1, pageSize: DEFAULT_TABLE_LIMIT, density: DEFAULT_DENSITY };
    }

    const parsed = JSON.parse(raw) as {
      filters?: unknown;
      page?: unknown;
      pageSize?: unknown;
      density?: unknown;
    };

    return {
      filters: buildFilterState(parsed.filters),
      page: parsePage(parsed.page),
      pageSize: parseTableLimit(parsed.pageSize),
      density: parseDensity(parsed.density),
    };
  } catch {
    return { filters: DEFAULT_FILTERS, page: 1, pageSize: DEFAULT_TABLE_LIMIT, density: DEFAULT_DENSITY };
  }
}

function readSavedViewLabel() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(VIAGENS_SAVED_VIEW_KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as { savedAt?: string };
    return parsed.savedAt ? "Visao salva neste navegador" : undefined;
  } catch {
    return undefined;
  }
}

const ViagensPage = () => {
  const queryClient = useQueryClient();
  const initialState = useMemo(() => readStoredViagensState(), []);
  const [filters, setFilters] = useState<ViagensFilterState>(initialState.filters);
  const [currentPage, setCurrentPage] = useState<number>(initialState.page);
  const [tableLimit, setTableLimit] = useState<number>(initialState.pageSize);
  const [density, setDensity] = useState<PaginationDensity>(initialState.density);
  const [sortBy, setSortBy] = useState<ViagensSortKey>(DEFAULT_SORT);
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [peopleRankingsReady, setPeopleRankingsReady] = useState(false);
  const [orgaoRankingsReady, setOrgaoRankingsReady] = useState(false);
  const [summaryComplementReady, setSummaryComplementReady] = useState(false);
  const [savedViewLabel, setSavedViewLabel] = useState<string | undefined>(() => readSavedViewLabel());
  const offset = (currentPage - 1) * tableLimit;

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
  const tablePagination = useMemo(() => ({ limit: tableLimit, offset }), [offset, tableLimit]);
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
        pageSize: tableLimit,
        density,
      })
    );
  }, [currentPage, density, filters, tableLimit]);

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
    tableLimit,
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
      tableLimit
    );

    queryClient.prefetchQuery({
      queryKey: ["viagens-painel", normalizedFilter, nextPagination, false],
      queryFn: ({ signal }) =>
        fetchViagensPainel(normalizedFilter, nextPagination, { signal, includeTotal: false }),
      staleTime: 60_000,
    });
  }, [normalizedFilter, queryClient, resumoCoreQuery.data?.totalViagens, tableLimit, viagensPainelQuery.data]);

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
    setTableLimit(DEFAULT_TABLE_LIMIT);
    setDensity(DEFAULT_DENSITY);
  };

  const handlePageChange = (nextOffset: number) => {
    setCurrentPage(Math.floor(nextOffset / tableLimit) + 1);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setTableLimit(pageSize);
    setCurrentPage(1);
  };

  const handleSaveView = () => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      VIAGENS_SAVED_VIEW_KEY,
      JSON.stringify({
        filters,
        pageSize: tableLimit,
        density,
        savedAt: new Date().toISOString(),
      })
    );
    setSavedViewLabel("Visao salva neste navegador");
  };

  const handleComparePreviousPeriod = () => {
    if (filters.anoInicio <= 2019 || filters.anoFim <= 2019) {
      return;
    }

    updateFilters({
      anoInicio: filters.anoInicio - 1,
      anoFim: filters.anoFim - 1,
    });
  };

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
  const canComparePreviousPeriod = filters.anoInicio > 2019 && filters.anoFim > 2019;

  return (
    <div className="overflow-x-hidden">
      <AppSidebar />

      <main className="overflow-x-hidden lg:ml-72">
        <div className="w-full px-3 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-6 lg:pt-10 xl:px-8 2xl:px-10">
          <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,248,251,0.92))] p-5 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0 max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Plane className="h-3.5 w-3.5" />
                  Painel de viagens
                </p>

                <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                  Viagens oficiais <span className="text-gradient-primary">em foco</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Leitura clara dos deslocamentos oficiais por periodo, orgao e viajante.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground">
                    {filters.anoInicio} a {filters.anoFim}
                  </span>
                  {activeFilterCount ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground">
                      {activeFilterCount} filtro(s)
                    </span>
                  ) : null}
                  {savedViewLabel ? (
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {savedViewLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                <article className="rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/8 via-white to-cyan-50 p-4 shadow-card sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Gasto liquido
                    </p>
                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Wallet className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {formatCentsCompact(resumoData?.totalGastoLiquidoCents)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCents(resumoData?.totalGastoLiquidoCents)}
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Viagens no recorte
                    </p>
                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Plane className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-extrabold text-foreground sm:text-2xl">
                    {formatCountCompact(totalViagensPainel)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {totalViagensPainel.toLocaleString("pt-BR")} viagens encontradas
                  </p>
                </article>
              </div>
            </div>
          </section>

          <div className="mt-6 space-y-6">
            <ViagensFilters
              value={filters}
              onChange={updateFilters}
              onReset={handleReset}
              onSaveView={handleSaveView}
              onComparePreviousPeriod={handleComparePreviousPeriod}
              canComparePreviousPeriod={canComparePreviousPeriod}
              savedViewLabel={savedViewLabel}
            />

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

            <ViagensAnalyticsDeck
              summary={resumoData}
              summaryError={
                (resumoComplementoQuery.error as Error | null) ||
                (resumoCoreQuery.error as Error | null) ||
                null
              }
              onRetrySummary={() => {
                void resumoCoreQuery.refetch();
                if (summaryComplementReady) {
                  void resumoComplementoQuery.refetch();
                }
              }}
              topGastadores={{
                data: topGastadoresQuery.data,
                isLoading: topGastadoresQuery.isLoading,
                error: (topGastadoresQuery.error as Error | null) || null,
                onRetry: () => void topGastadoresQuery.refetch(),
              }}
              topViajantes={{
                data: topViajantesQuery.data,
                isLoading: topViajantesQuery.isLoading,
                error: (topViajantesQuery.error as Error | null) || null,
                onRetry: () => void topViajantesQuery.refetch(),
              }}
              topOrgaosSuperiores={{
                data: topOrgaosSuperioresQuery.data,
                isLoading: topOrgaosSuperioresQuery.isLoading,
                error: (topOrgaosSuperioresQuery.error as Error | null) || null,
                onRetry: () => void topOrgaosSuperioresQuery.refetch(),
              }}
              topOrgaosSolicitantes={{
                data: topOrgaosSolicitantesQuery.data,
                isLoading: topOrgaosSolicitantesQuery.isLoading,
                error: (topOrgaosSolicitantesQuery.error as Error | null) || null,
                onRetry: () => void topOrgaosSolicitantesQuery.refetch(),
              }}
            />

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
                density={density}
                onDensityChange={setDensity}
                pageSizeOptions={TABLE_LIMIT_OPTIONS}
                onPageSizeChange={handlePageSizeChange}
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
