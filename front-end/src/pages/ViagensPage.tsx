import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Wallet } from "lucide-react";

import type { RankingViagemFiltroInput, Viagem } from "@/api/types";
import AppSidebar from "@/components/AppSidebar";
import SeoHead from "@/components/SeoHead";
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
import { buildBreadcrumbStructuredData } from "@/lib/seo";
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
    return parsed.savedAt ? "Visão salva neste navegador" : undefined;
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
    setSavedViewLabel("Visão salva neste navegador");
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
  const seoDescription =
    "Explore o painel de viagens oficiais com filtros por período, órgão, viajante e destino, além de rankings e detalhes consolidados.";

  return (
    <div className="overflow-x-hidden">
      <SeoHead
        title="Viagens oficiais | Radar do Povo"
        description={seoDescription}
        path="/viagens"
        keywords={[
          "viagens oficiais",
          "gastos com viagens",
          "painel de viagens",
          "viagens públicas",
          "radar do povo viagens",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Painel de viagens oficiais",
            description: seoDescription,
            url: "https://radardopovo.com/viagens",
            inLanguage: "pt-BR",
            isPartOf: {
              "@type": "WebSite",
              name: "Radar do Povo",
              url: "https://radardopovo.com",
            },
            about: [
              { "@type": "Thing", name: "Viagens oficiais" },
              { "@type": "Thing", name: "Gastos públicos" },
              { "@type": "Thing", name: "Transparência pública" },
            ],
          },
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Viagens", path: "/viagens" },
          ]),
        ]}
      />
      <AppSidebar />

      <main className="overflow-x-hidden lg:ml-72">
        <div className="w-full px-4 pb-16 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:px-6 lg:pt-10 xl:px-8 2xl:px-10">

          {/* ── Hero Premium ── */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/30 px-7 py-10 shadow-xl backdrop-blur-xl ring-1 ring-black/5 sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 left-[52%] w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
              <div className="animate-float-wide absolute -right-20 -top-10 h-72 w-72 rounded-full bg-primary/10 blur-[80px]" />
              <div className="animate-float-slow absolute right-32 top-20 h-48 w-48 rounded-full border border-primary/20 bg-gradient-to-tr from-primary/5 to-transparent shadow-lg" />
              <div className="animate-float-wide absolute -left-10 top-20 h-56 w-56 rounded-full bg-amber-500/5 blur-[60px]" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

              {/* Left: title block */}
              <div className="min-w-0 max-w-2xl">
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
                  <Plane className="h-3.5 w-3.5" />
                  Painel de viagens
                </p>

                <h1 className="mt-2 text-[2.25rem] font-extrabold leading-[1.15] tracking-tighter text-foreground drop-shadow-sm sm:text-[3.25rem]">
                  Viagens oficiais{" "}
                  <span className="relative inline-block">
                    <span className="absolute -inset-1 rounded-xl bg-primary/15 blur-xl"></span>
                    <span className="relative bg-gradient-to-br from-primary via-primary/90 to-blue-600 bg-clip-text text-transparent">em foco</span>
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-[15px]">
                  Leitura clara dos deslocamentos oficiais por período, órgão e viajante, refinada e organizada.
                </p>

                {/* Meta chips */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                    {filters.anoInicio === filters.anoFim
                      ? filters.anoInicio
                      : `${filters.anoInicio} - ${filters.anoFim}`}
                  </span>

                  {activeFilterCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur-md">
                      {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo{activeFilterCount > 1 ? "s" : ""}
                    </span>
                  ) : null}

                  {savedViewLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-bold text-blue-600 shadow-sm backdrop-blur-md">
                      {savedViewLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Right: summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:w-[460px] xl:shrink-0">

                {/* Gasto líquido — destaque principal */}
                <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/40 px-5 py-6 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/70 hover:shadow-xl">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors group-hover:text-foreground">
                        Gasto líquido
                      </p>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-md">
                        <Wallet className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl drop-shadow-sm">
                      {formatCentsCompact(resumoData?.totalGastoLiquidoCents)}
                    </p>
                    <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
                      {formatCents(resumoData?.totalGastoLiquidoCents)}
                    </p>
                  </div>
                </article>

                {/* Viagens no recorte — neutro */}
                <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/40 px-5 py-6 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/70 hover:shadow-xl">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors group-hover:text-foreground">
                        Viagens no recorte
                      </p>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/80 text-muted-foreground shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-muted group-hover:text-foreground">
                        <Plane className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {formatCountCompact(totalViagensPainel)}
                    </p>
                    <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
                      {totalViagensPainel.toLocaleString("pt-BR")} viagens
                    </p>
                  </div>
                </article>

              </div>
            </div>
          </section>

          {/* ── Content sections ── */}
          <div className="mt-8 space-y-8">
            <div className="rounded-[2rem] border border-white/50 bg-white/30 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
              <ViagensFilters
                value={filters}
                onChange={updateFilters}
                onReset={handleReset}
                onSaveView={handleSaveView}
                onComparePreviousPeriod={handleComparePreviousPeriod}
                canComparePreviousPeriod={canComparePreviousPeriod}
                savedViewLabel={savedViewLabel}
              />
            </div>

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

            <section className="min-w-0 rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
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