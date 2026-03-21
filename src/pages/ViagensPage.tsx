import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane } from "lucide-react";
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

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = CURRENT_YEAR - 1;
const TABLE_LIMIT = 20;
const RANKING_LIMIT = 5;
const DEFAULT_SORT: ViagensSortKey = "data_desc";

const DEFAULT_FILTERS: ViagensFilterState = {
  recorte: "geral",
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

const recorteMeta: Record<
  ViagensRecorte,
  { label: string; description: string; eyebrow: string }
> = {
  geral: {
    label: "Painel geral de viagens",
    description: "Visao completa das viagens oficiais sem filtro por cargo parlamentar.",
    eyebrow: "Recorte Geral",
  },
  deputados: {
    label: "Recorte de deputados",
    description: "Visao das viagens oficiais filtradas para deputados.",
    eyebrow: "Camara Federal",
  },
  senadores: {
    label: "Recorte de senadores",
    description: "Visao das viagens oficiais filtradas para senadores.",
    eyebrow: "Senado Federal",
  },
};

function parseYear(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2019 && parsed <= CURRENT_YEAR ? parsed : fallback;
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
    processoId: searchParams.get("processoId") || "",
    pcdp: searchParams.get("pcdp") || "",
    cpfViajante: searchParams.get("cpfViajante") || "",
    nomeViajante: searchParams.get("nomeViajante") || "",
    cargo: searchParams.get("cargo") || "",
    funcao: searchParams.get("funcao") || "",
    destino: searchParams.get("destino") || "",
    motivo: searchParams.get("motivo") || "",
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
  if (filter.processoId.trim()) {
    params.set("processoId", filter.processoId.trim());
  }
  if (filter.pcdp.trim()) {
    params.set("pcdp", filter.pcdp.trim());
  }
  if (filter.cpfViajante.trim()) {
    params.set("cpfViajante", filter.cpfViajante.trim());
  }
  if (filter.nomeViajante.trim()) {
    params.set("nomeViajante", filter.nomeViajante.trim());
  }
  if (filter.cargo.trim()) {
    params.set("cargo", filter.cargo.trim());
  }
  if (filter.funcao.trim()) {
    params.set("funcao", filter.funcao.trim());
  }
  if (filter.destino.trim()) {
    params.set("destino", filter.destino.trim());
  }
  if (filter.motivo.trim()) {
    params.set("motivo", filter.motivo.trim());
  }

  return params;
}

const ViagensPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<ViagensSortKey>(DEFAULT_SORT);
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [peopleRankingsReady, setPeopleRankingsReady] = useState(false);
  const [orgaoRankingsReady, setOrgaoRankingsReady] = useState(false);
  const [summaryComplementReady, setSummaryComplementReady] = useState(false);

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
        processoId: filters.processoId,
        pcdp: filters.pcdp,
        cpfViajante: filters.cpfViajante,
        nomeViajante: filters.nomeViajante,
        cargo: filters.cargo,
        funcao: filters.funcao,
        destino: filters.destino,
        motivo: filters.motivo,
      }),
    [filters]
  );

  const rankingPagination = useMemo(() => ({ limit: RANKING_LIMIT, offset: 0 }), []);
  const tablePagination = useMemo(() => ({ limit: TABLE_LIMIT, offset }), [offset]);
  const normalizedFilter = useMemo(() => normalizeViagensFilter(apiFilter), [apiFilter]);
  const recorteInfo = recorteMeta[filters.recorte];

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
    setPeopleRankingsReady(false);
    setOrgaoRankingsReady(false);
    setSummaryComplementReady(false);
  }, [
    filters.recorte,
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
    filters.recorte,
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
    <div className="min-h-screen overflow-x-hidden bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen overflow-x-hidden lg:ml-72">
        <div className="w-full px-3 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-6 lg:pt-10 xl:px-8 2xl:px-10">
          <section className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,248,255,0.9))] p-5 shadow-elevated backdrop-blur-sm sm:rounded-[34px] sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="min-w-0 space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Plane className="h-3.5 w-3.5" />
                  Area de Viagens
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {recorteInfo.eyebrow}
                    </p>
                    <h1 className="mt-2 max-w-4xl text-2xl font-extrabold leading-tight text-foreground sm:text-4xl">
                      Viagens oficiais com{" "}
                      <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-slate-900 bg-clip-text text-transparent">
                        filtros reais, leitura rapida e detalhe sob demanda
                      </span>
                    </h1>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {recorteInfo.label}. {recorteInfo.description} Tudo fica sincronizado com a URL,
                    com ranking, resumo e tabela respondendo ao mesmo recorte.
                  </p>
                </div>

                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    dados oficiais consolidados
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                    detalhe sob demanda por processo
                  </span>
                </div>
              </div>

              <div className="min-w-0 grid gap-3 sm:grid-cols-2 sm:gap-4">
                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Recorte ativo
                  </p>
                  <p className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
                    {recorteInfo.label}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Mesmo recorte aplicado no resumo, rankings e tabela.
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Periodo ativo
                  </p>
                  <p className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
                    {filters.anoInicio} - {filters.anoFim}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Filtro sincronizado com a URL e aplicado em toda a pagina.
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Total no recorte
                  </p>
                  <p className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
                    {totalViagensPainel.toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Quantidade de viagens retornadas para o recorte atual.
                  </p>
                </article>

                <article className="rounded-[24px] border border-border/70 bg-white/95 p-4 shadow-card sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Soma da pagina
                  </p>
                  <p className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
                    {formatCents(selectedTotal.toString())}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Soma estimada dos itens exibidos na pagina atual.
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
