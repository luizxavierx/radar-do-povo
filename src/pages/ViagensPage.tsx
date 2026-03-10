import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, BadgeCheck, Building2, Clock3, Plane, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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
import { formatCents, toBigInt } from "@/lib/formatters";
import {
  applyRecorteToViagensFilter,
  fetchViagensPainel,
  normalizeViagensFilter,
  type ViagensRecorte,
} from "@/services/viagensService";

const DEFAULT_YEAR = 2025;
const TABLE_LIMIT = 20;
const RANKING_LIMIT = 10;
const DEFAULT_SORT: ViagensSortKey = "data_desc";

const DEFAULT_FILTERS: ViagensFilterState = {
  recorte: "geral",
  anoInicio: DEFAULT_YEAR,
  anoFim: DEFAULT_YEAR,
  orgaoSuperiorCodigo: "",
  orgaoSolicitanteCodigo: "",
  search: "",
  situacao: "",
};

const recorteMeta: Record<
  ViagensRecorte,
  { label: string; description: string; eyebrow: string }
> = {
  geral: {
    label: "Painel geral de parlamentares",
    description:
      "Ranking anual otimizado quando o filtro e de um unico ano e sem refinamentos extras.",
    eyebrow: "Recorte Geral",
  },
  deputados: {
    label: "Painel exclusivo de deputados",
    description: "KPIs, rankings e tabela principal filtrados por cargo parlamentar DEPUTADO.",
    eyebrow: "Camara Federal",
  },
  senadores: {
    label: "Painel exclusivo de senadores",
    description: "KPIs, rankings e tabela principal filtrados por cargo parlamentar SENADOR.",
    eyebrow: "Senado Federal",
  },
};

function parseYear(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2019 && parsed <= 2026 ? parsed : fallback;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseRecorte(value: string | null): ViagensRecorte {
  if (value === "deputados" || value === "senadores" || value === "geral") {
    return value;
  }
  return DEFAULT_FILTERS.recorte;
}

function buildFilterState(searchParams: URLSearchParams): ViagensFilterState {
  const anoInicio = parseYear(searchParams.get("anoInicio"), DEFAULT_FILTERS.anoInicio);
  const anoFim = parseYear(searchParams.get("anoFim"), DEFAULT_FILTERS.anoFim);

  return {
    recorte: parseRecorte(searchParams.get("recorte")),
    anoInicio: Math.min(anoInicio, anoFim),
    anoFim: Math.max(anoInicio, anoFim),
    orgaoSuperiorCodigo: searchParams.get("orgaoSuperiorCodigo") || "",
    orgaoSolicitanteCodigo: searchParams.get("orgaoSolicitanteCodigo") || "",
    search: searchParams.get("search") || "",
    situacao: searchParams.get("situacao") || "",
  };
}

function toSearchParams(filter: ViagensFilterState, page: number) {
  const params = new URLSearchParams();
  params.set("recorte", filter.recorte);
  params.set("anoInicio", String(filter.anoInicio));
  params.set("anoFim", String(filter.anoFim));
  params.set("page", String(page));

  if (filter.orgaoSuperiorCodigo.trim()) {
    params.set("orgaoSuperiorCodigo", filter.orgaoSuperiorCodigo.trim());
  }
  if (filter.orgaoSolicitanteCodigo.trim()) {
    params.set("orgaoSolicitanteCodigo", filter.orgaoSolicitanteCodigo.trim());
  }
  if (filter.search.trim()) {
    params.set("search", filter.search.trim());
  }
  if (filter.situacao.trim()) {
    params.set("situacao", filter.situacao.trim());
  }

  return params;
}

const ViagensPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<ViagensSortKey>(DEFAULT_SORT);
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);

  const filters = useMemo(() => buildFilterState(searchParams), [searchParams]);
  const currentPage = parsePage(searchParams.get("page"));
  const offset = (currentPage - 1) * TABLE_LIMIT;

  const apiFilter = useMemo<RankingViagemFiltroInput>(
    () =>
      applyRecorteToViagensFilter(filters.recorte, {
        anoInicio: filters.anoInicio,
        anoFim: filters.anoFim,
        orgaoSuperiorCodigo: filters.orgaoSuperiorCodigo,
        orgaoSolicitanteCodigo: filters.orgaoSolicitanteCodigo,
        search: filters.search,
        situacao: filters.situacao,
      }),
    [filters]
  );

  const rankingPagination = useMemo(() => ({ limit: RANKING_LIMIT, offset: 0 }), []);
  const tablePagination = useMemo(() => ({ limit: TABLE_LIMIT, offset }), [offset]);
  const normalizedFilter = useMemo(() => normalizeViagensFilter(apiFilter), [apiFilter]);
  const recorteInfo = recorteMeta[filters.recorte];
  const hasAdvancedFilters = Boolean(
    filters.search ||
      filters.situacao ||
      filters.orgaoSuperiorCodigo ||
      filters.orgaoSolicitanteCodigo
  );
  const usingAnnualShortcuts = filters.anoInicio === filters.anoFim && !hasAdvancedFilters;

  const resumoQuery = useResumoViagens(apiFilter);
  const topViajantesQuery = useTopViajantes(apiFilter, rankingPagination);
  const topGastadoresQuery = useTopGastadoresViagens(apiFilter, rankingPagination);
  const topOrgaosSuperioresQuery = useTopOrgaosSuperioresViagens(apiFilter, rankingPagination);
  const topOrgaosSolicitantesQuery = useTopOrgaosSolicitantesViagens(apiFilter, rankingPagination);
  const viagensPainelQuery = useViagensPainel(apiFilter, tablePagination);
  const detalheQuery = useDetalheViagem(
    selectedViagem
      ? {
          processoId: selectedViagem.processoId || "",
          nomeViajante: selectedViagem.nomeViajante,
          anoInicio: filters.anoInicio,
          anoFim: filters.anoFim,
        }
      : undefined,
    Boolean(selectedViagem)
  );

  useEffect(() => {
    const hasBaseParams =
      Boolean(searchParams.get("recorte")) &&
      Boolean(searchParams.get("anoInicio")) &&
      Boolean(searchParams.get("anoFim")) &&
      Boolean(searchParams.get("page"));

    if (!hasBaseParams) {
      setSearchParams(toSearchParams(filters, currentPage), { replace: true });
    }
  }, [currentPage, filters, searchParams, setSearchParams]);

  useEffect(() => {
    setSelectedViagem(null);
  }, [
    filters.recorte,
    filters.anoInicio,
    filters.anoFim,
    filters.orgaoSuperiorCodigo,
    filters.orgaoSolicitanteCodigo,
    filters.search,
    filters.situacao,
    currentPage,
  ]);

  useEffect(() => {
    const data = viagensPainelQuery.data;
    if (!data) return;

    const nextOffset = data.offset + data.limit;
    if (nextOffset >= data.total) return;

    const nextPagination = normalizePagination(
      { limit: data.limit, offset: nextOffset },
      TABLE_LIMIT
    );

    queryClient.prefetchQuery({
      queryKey: ["viagens-painel", normalizedFilter, nextPagination],
      queryFn: ({ signal }) =>
        fetchViagensPainel(normalizedFilter, nextPagination, { signal }),
      staleTime: 60_000,
    });
  }, [normalizedFilter, queryClient, viagensPainelQuery.data]);

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

    setSearchParams(toSearchParams(next, 1), { replace: true });
  };

  const handleReset = () => {
    setSortBy(DEFAULT_SORT);
    setSearchParams(toSearchParams(DEFAULT_FILTERS, 1), { replace: true });
  };

  const handlePageChange = (nextOffset: number) => {
    const nextPage = Math.floor(nextOffset / TABLE_LIMIT) + 1;
    setSearchParams(toSearchParams(filters, nextPage), { replace: true });
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

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,248,255,0.9))] p-6 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Plane className="h-3.5 w-3.5" />
                  Area de Viagens
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {recorteInfo.eyebrow}
                    </p>
                    <h1 className="mt-2 max-w-4xl text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                      Painel de viagens oficiais com{" "}
                      <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-slate-900 bg-clip-text text-transparent">
                        blocos independentes, cache e detalhe sob demanda
                      </span>
                    </h1>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {recorteInfo.label}. {recorteInfo.description} A pagina nao faz query monolitica:
                    KPIs, rankings, tabela e detalhe possuem loading, retry e timeout separados.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    request_id exposto em erro
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    stale-while-revalidate ativo
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    busca antiga cancelada
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[28px] border border-border/70 bg-white/95 p-5 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Periodo Ativo
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-foreground">
                    {filters.anoInicio} - {filters.anoFim}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Filtro sincronizado com a URL e aplicado em todos os blocos.
                  </p>
                </article>

                <article className="rounded-[28px] border border-border/70 bg-white/95 p-5 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Ranking Mode
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-foreground">
                    {usingAnnualShortcuts ? "Anual otimizado" : "Filtro composto"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {usingAnnualShortcuts
                      ? "Usando rankings anuais prontos da API sempre que possivel."
                      : "Usando filtros completos por orgao, situacao e busca."}
                  </p>
                </article>

                <article className="rounded-[28px] border border-border/70 bg-white/95 p-5 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tabela Atual
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-foreground">
                    {(viagensPainelQuery.data?.total ?? 0).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Registros no recorte atual com pagina de {TABLE_LIMIT} itens.
                  </p>
                </article>

                <article className="rounded-[28px] border border-border/70 bg-white/95 p-5 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Blocos Ativos
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BadgeCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-foreground">6 + detalhe</p>
                      <p className="text-sm text-muted-foreground">
                        resumo, rankings, orgaos e tabela principal
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <div className="mt-6 space-y-6">
            <ViagensFilters value={filters} onChange={updateFilters} onReset={handleReset} />

            <ViagensKpis
              data={resumoQuery.data}
              isLoading={resumoQuery.isLoading}
              error={(resumoQuery.error as Error | null) || null}
              onRetry={() => void resumoQuery.refetch()}
            />

            <section className="grid gap-4 xl:grid-cols-4">
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

            <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <ViagensTable
                data={viagensPainelQuery.data}
                isLoading={viagensPainelQuery.isLoading}
                error={(viagensPainelQuery.error as Error | null) || null}
                onRetry={() => void viagensPainelQuery.refetch()}
                onOpenDetail={setSelectedViagem}
                selectedProcessoId={selectedViagem?.processoId}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onPageChange={handlePageChange}
              />

              <aside className="space-y-4">
                <section className="rounded-[28px] border border-border/75 bg-card/92 p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Painel rapido</h3>
                      <p className="text-xs text-muted-foreground">
                        Leitura do recorte e da pagina atual
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Recorte
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{recorteInfo.label}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Pagina atual
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{currentPage}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Soma da pagina
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatCents(selectedTotal.toString())}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-border/75 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-5 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Estrategia de carregamento
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <p>1. KPIs e rankings carregam em paralelo.</p>
                    <p>2. Tabela usa pagina 20 e prefetch da proxima pagina.</p>
                    <p>3. Drawer so abre detalhe real quando o usuario pede.</p>
                    <p>4. Todas as chamadas passam timeout, retry curto e cancelamento.</p>
                  </div>
                </section>
              </aside>
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
