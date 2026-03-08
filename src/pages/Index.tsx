import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Banknote,
  Building2,
  Crown,
  Globe,
  Landmark,
  Medal,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";

import AppSidebar from "@/components/AppSidebar";
import SearchBar from "@/components/SearchBar";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  useApiHealth,
  useFeaturedPoliticos,
  usePoliticos,
} from "@/hooks/usePoliticos";
import {
  CargoParlamentar,
  useRankingCargoMap,
  useTopDeputadosAno,
  useTopEmendasPorPaisAno,
  useTopGastadoresAno,
  useTopSenadoresAno,
} from "@/hooks/useRankings";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  POLITICOS_LIST_QUERY,
  TOP_GASTADORES_EMENDAS_ANO_QUERY,
} from "@/api/queries";
import { centsToNumber, formatCents, toBigInt } from "@/lib/formatters";
import type { Connection, PoliticoResumo, RankingConnection, TopGastadorEmenda } from "@/api/types";

const PAGE_SIZE = 20;
const rankIcons = [Crown, Trophy, Medal];

const years = Array.from({ length: 8 }, (_, i) => 2026 - i);

type TabId = "geral" | "deputados" | "senadores";

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "geral", label: "Ranking geral", icon: BarChart3 },
  { id: "deputados", label: "Deputados", icon: Users },
  { id: "senadores", label: "Senadores", icon: Landmark },
];

const tabTitles: Record<TabId, string> = {
  geral: "Top geral",
  deputados: "Top deputados",
  senadores: "Top senadores",
};

const featuredFallback = [
  { key: "lula", search: "lula", nome: "Luiz Inacio Lula da Silva" },
  { key: "bolsonaro", search: "bolsonaro", nome: "Jair Messias Bolsonaro" },
  { key: "arthurLira", search: "arthur lira", nome: "Arthur Lira" },
  { key: "daviAlcolumbre", search: "davi alcolumbre", nome: "Davi Alcolumbre" },
  { key: "flavioDino", search: "flavio dino", nome: "Flavio Dino" },
  { key: "simoneTebet", search: "simone tebet", nome: "Simone Tebet" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("geral");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [offset, setOffset] = useState(0);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pagination = { limit: PAGE_SIZE, offset };

  const apiHealthQuery = useApiHealth();
  const featuredQuery = useFeaturedPoliticos();

  const geralQuery = useTopGastadoresAno(
    selectedYear,
    activeTab === "geral" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );
  const deputadosQuery = useTopDeputadosAno(selectedYear, { limit: 30, offset: 0 });
  const senadoresQuery = useTopSenadoresAno(selectedYear, { limit: 30, offset: 0 });
  const paisesQuery = useTopEmendasPorPaisAno(selectedYear, { limit: 10, offset: 0 });

  const activeQueryMap = {
    geral: geralQuery,
    deputados: deputadosQuery,
    senadores: senadoresQuery,
  };

  const activeQuery = activeQueryMap[activeTab];

  const searchQuery = usePoliticos(
    searchTerm ? { search: searchTerm } : undefined,
    { limit: PAGE_SIZE, offset }
  );

  const isSearching = Boolean(searchTerm);
  const cargoTab: CargoParlamentar | null =
    activeTab === "deputados"
      ? "DEPUTADO"
      : activeTab === "senadores"
      ? "SENADOR"
      : null;
  const rawRankingNodes = (activeQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [];
  const cargoMapQuery = useRankingCargoMap(rawRankingNodes, !isSearching && Boolean(cargoTab));
  const filteredRankingNodes = useMemo(() => {
    if (!cargoTab) return rawRankingNodes;
    const map = cargoMapQuery.data || {};
    return rawRankingNodes.filter((node) => map[node.nomeAutorEmenda] === cargoTab);
  }, [cargoMapQuery.data, cargoTab, rawRankingNodes]);
  const rankingNodes = useMemo(() => {
    if (!cargoTab) return rawRankingNodes;
    return filteredRankingNodes.slice(offset, offset + PAGE_SIZE);
  }, [cargoTab, filteredRankingNodes, offset, rawRankingNodes]);

  const totalPagoCents = useMemo(
    () => rankingNodes.reduce((acc, node) => acc + toBigInt(node.totalPagoCents), 0n),
    [rankingNodes]
  );

  const totalPago = formatCents(totalPagoCents.toString());
  const totalEmendas = rankingNodes.reduce((acc, node) => acc + (node.totalEmendas || 0), 0);
  const mediaPagoPorEmenda =
    totalEmendas > 0 ? formatCents((totalPagoCents / BigInt(totalEmendas)).toString()) : "R$ 0,00";

  const graficoTop = useMemo(
    () =>
      rankingNodes.slice(0, 6).map((node) => ({
        nome: shortName(node.nomeAutorEmenda),
        valor: centsToNumber(node.totalPagoCents),
      })),
    [rankingNodes]
  );

  const topPais = paisesQuery.data?.nodes?.[0];
  const featuredPoliticos: { key: string; search: string; politico?: PoliticoResumo }[] =
    featuredQuery.data?.length
      ? featuredQuery.data
      : featuredFallback.map((item) => ({
          key: item.key,
          search: item.search,
          politico: undefined,
        }));

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setOffset(0);
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setOffset(0);
  };

  const total = isSearching
    ? searchQuery.data?.total ?? 0
    : cargoTab
    ? filteredRankingNodes.length
    : activeQuery.data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;

  useEffect(() => {
    const nextOffset = offset + PAGE_SIZE;
    const nextPagination = { limit: PAGE_SIZE, offset: nextOffset };

    if (isSearching) {
      if (!searchTerm || !searchQuery.data || nextOffset >= searchQuery.data.total) return;
      const filter = { search: searchTerm };

      queryClient.prefetchQuery({
        queryKey: ["politicos", filter, nextPagination],
        queryFn: ({ signal }) =>
          graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
            POLITICOS_LIST_QUERY,
            { filter, pagination: nextPagination },
            { signal }
          ).then((d) => d.politicos),
        staleTime: 60_000,
      });
      return;
    }

    if (!activeQuery.data || nextOffset >= activeQuery.data.total) return;

    if (activeTab === "deputados" || activeTab === "senadores") {
      return;
    }

    if (activeTab === "geral") {
      queryClient.prefetchQuery({
        queryKey: ["top-gastadores-ano", selectedYear, nextPagination],
        queryFn: ({ signal }) =>
          graphqlRequest<{ topGastadoresEmendasAno: RankingConnection<TopGastadorEmenda> }>(
            TOP_GASTADORES_EMENDAS_ANO_QUERY,
            { ano: selectedYear, pagination: nextPagination },
            { signal }
          ).then((d) => d.topGastadoresEmendasAno),
        staleTime: 60_000,
      });
      return;
    }
  }, [
    activeQuery.data,
    activeTab,
    isSearching,
    offset,
    queryClient,
    searchQuery.data,
    searchTerm,
    selectedYear,
  ]);

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/60 bg-card/85 p-7 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Painel de transparencia
                </p>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                  Radar do Povo <span className="text-gradient-primary">moderno e orientado por dados</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  Visao consolidada de emendas parlamentares, trilha de gastos publicos e sinais de concentracao por parlamentar e por pais.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={apiHealthQuery.data?.status}
                  loading={apiHealthQuery.isLoading}
                />

                <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Ano
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                      setOffset(0);
                    }}
                    className="bg-transparent text-xs outline-none"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="mt-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching && searchQuery.isLoading}
              placeholder="Digite nome, partido ou parte do nome canonico"
              submitLabel="Consultar"
              autoSearch
              debounceMs={300}
            />
          </section>

          {!isSearching ? (
            <section className="mt-8 rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold sm:text-lg">Perfis em destaque</h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Atalhos para os nomes mais buscados no momento.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/busca")}
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  <Search className="h-3.5 w-3.5" />
                  Ver busca completa
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {featuredPoliticos.map((perfil) => {
                  const politico = perfil.politico;
                  const nome = politico?.nomeCompleto || politico?.nomeCanonico || perfil.search;
                  const partido = politico?.partido;
                  const uf = politico?.uf;
                  const imageUrl = politico?.fotoUrl || buildAvatarUrl(nome);

                  return (
                    <button
                      key={perfil.key}
                      onClick={() =>
                        politico?.nomeCanonico
                          ? navigate(`/politico/${encodeURIComponent(politico.nomeCanonico)}`)
                          : handleSearch(perfil.search)
                      }
                      className="rounded-2xl border border-border/80 bg-background/90 px-3 py-3 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={imageUrl}
                          alt={nome}
                          className="h-9 w-9 flex-shrink-0 rounded-full border border-border object-cover"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-foreground">
                            {nome}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {[partido, uf].filter(Boolean).join(" - ") || "Perfil principal"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isSearching ? (
            <section className="mt-8 space-y-4 animate-fade-up" style={{ animationDelay: "180ms" }}>
              {searchQuery.isLoading ? <LoadingState message="Buscando politicos na API..." /> : null}
              {searchQuery.error ? <ErrorState error={searchQuery.error as Error} /> : null}
              {!searchQuery.isLoading && !searchQuery.error && searchQuery.data?.nodes.length === 0 ? (
                <EmptyState message="Nenhum politico encontrado para este termo." />
              ) : null}

              {searchQuery.data?.nodes.map((politico) => (
                <button
                  key={politico.id}
                  onClick={() =>
                    navigate(`/politico/${encodeURIComponent(politico.nomeCanonico || politico.id)}`)
                  }
                  className="w-full text-left"
                >
                  <PoliticianSearchCard politico={politico} />
                </button>
              ))}
            </section>
          ) : (
            <>
              <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                  label="Total pago top"
                  value={totalPago}
                  description={`${tabTitles[activeTab]} ${selectedYear}`}
                  icon={Banknote}
                  variant="green"
                />
                <StatsCard
                  label="Parlamentares"
                  value={String(total)}
                  description="Registro retornado pela API"
                  icon={Users}
                  variant="blue"
                />
                <StatsCard
                  label="Total emendas"
                  value={totalEmendas.toLocaleString("pt-BR")}
                  description="Soma de emendas do recorte"
                  icon={BarChart3}
                  variant="yellow"
                />
                <StatsCard
                  label="Ticket por emenda"
                  value={mediaPagoPorEmenda}
                  description="Total pago dividido por emendas"
                  icon={ShieldCheck}
                  variant="blue"
                />
              </section>

              <section className="mt-7 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                      tab.id === activeTab
                        ? "border-primary/30 bg-gradient-hero text-primary-foreground shadow-glow"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </section>

              <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  {activeQuery.isLoading || (Boolean(cargoTab) && cargoMapQuery.isLoading) ? (
                    <LoadingState message="Carregando ranking da API..." />
                  ) : null}
                  {activeQuery.error ? <ErrorState error={activeQuery.error as Error} /> : null}
                  {cargoMapQuery.error ? <ErrorState error={cargoMapQuery.error as Error} /> : null}
                  {!activeQuery.isLoading &&
                  !activeQuery.error &&
                  !cargoMapQuery.isLoading &&
                  rankingNodes.length === 0 ? (
                    <EmptyState message="A API nao retornou ranking para este ano." />
                  ) : null}

                  {rankingNodes.map((node, index) => (
                    <RankingRow
                      key={`${node.nomeAutorEmenda}-${offset + index}`}
                      node={node}
                      rank={offset + index + 1}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-bold">Comparativo dos 6 primeiros</h2>
                      <span className="text-[11px] text-muted-foreground">{selectedYear}</span>
                    </div>

                    {graficoTop.length ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={graficoTop} margin={{ top: 8, right: 0, left: 0, bottom: 12 }}>
                            <defs>
                              <linearGradient id="topBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(182 89% 30%)" />
                                <stop offset="100%" stopColor="hsl(212 93% 47%)" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(206 26% 82%)" />
                            <XAxis dataKey="nome" tickLine={false} axisLine={false} fontSize={11} />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              width={72}
                              fontSize={11}
                              tickFormatter={(value) => `R$ ${(value / 1_000_000).toFixed(1)}M`}
                            />
                            <RechartsTooltip
                              cursor={{ fill: "hsl(200 36% 96%)" }}
                              formatter={(value: number) =>
                                value.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                  maximumFractionDigits: 0,
                                })
                              }
                            />
                            <Bar dataKey="valor" fill="url(#topBarGradient)" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyState message="Sem dados suficientes para grafico." />
                    )}
                  </section>

                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                      <Globe className="h-4 w-4 text-accent" />
                      Top paises beneficiados
                    </h2>

                    {paisesQuery.isLoading ? <LoadingState message="Carregando recorte por pais..." /> : null}
                    {paisesQuery.error ? <ErrorState error={paisesQuery.error as Error} /> : null}
                    {!paisesQuery.isLoading && !paisesQuery.error && !paisesQuery.data?.nodes.length ? (
                      <EmptyState message="Sem dados por pais no ano selecionado." />
                    ) : null}

                    <div className="space-y-2">
                      {paisesQuery.data?.nodes.slice(0, 5).map((pais, index) => (
                        <div
                          key={`${pais.pais}-${index}`}
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {index + 1}. {pais.pais}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {pais.totalEmendas ?? 0} emendas registradas
                            </p>
                          </div>
                          <span className="text-xs font-bold text-primary">{formatCents(pais.totalPagoCents)}</span>
                        </div>
                      ))}
                    </div>

                    {topPais ? (
                      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                        Maior volume no ano: <strong>{topPais.pais}</strong> com {formatCents(topPais.totalPagoCents)}.
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-bold">Atalhos de exploracao</h2>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => navigate("/rankings")}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-medium hover:bg-muted/70"
                      >
                        Abrir ranking com filtros avancados
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => navigate("/busca")}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-medium hover:bg-muted/70"
                      >
                        Ir para busca detalhada de politicos
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </section>
                </div>
              </section>
            </>
          )}

          {total > PAGE_SIZE ? (
            <section className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Proxima
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
};

const StatusBadge = ({
  status,
  loading,
}: {
  status?: string;
  loading?: boolean;
}) => {
  const normalized = (status || "unknown").toLowerCase();

  const label =
    normalized === "ok"
      ? "API online"
      : normalized === "degraded"
      ? "API instavel"
      : normalized === "offline"
      ? "API offline"
      : "API sem status";

  const tone =
    normalized === "ok"
      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
      : normalized === "degraded"
      ? "border-amber-300 bg-amber-100 text-amber-700"
      : "border-red-300 bg-red-100 text-red-700";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold ${tone}`}>
      <ShieldCheck className="h-3.5 w-3.5" />
      {loading ? "Validando API..." : label}
    </span>
  );
};

const RankingRow = ({ node, rank }: { node: TopGastadorEmenda; rank: number }) => {
  const Icon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <article className="group rounded-2xl border border-border/80 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-soft text-primary">
          {Icon ? <Icon className="h-4.5 w-4.5" /> : <span className="text-xs font-bold">#{rank}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
            {node.nomeAutorEmenda}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{node.totalEmendas ?? 0} emendas registradas</p>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-primary">{formatCents(node.totalPagoCents)}</p>
          <p className="text-[10px] text-muted-foreground">total pago</p>
        </div>
      </div>
    </article>
  );
};

const PoliticianSearchCard = ({ politico }: { politico: PoliticoResumo }) => (
  <article className="group rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
    <div className="flex items-center gap-3">
      {politico.fotoUrl ? (
        <img src={politico.fotoUrl} alt={politico.nomeCanonico} className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary">
          {politico.nomeCompleto || politico.nomeCanonico}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          {politico.partido ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
              {politico.partido}
            </span>
          ) : null}
          {politico.uf ? (
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
              {politico.uf}
            </span>
          ) : null}
          {politico.cargoAtual ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent">
              {politico.cargoAtual}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  </article>
);

function shortName(value?: string): string {
  if (!value) return "-";
  return value
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .slice(0, 18);
}

function buildAvatarUrl(value: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    value
  )}&background=e6f7f7&color=0f766e&size=128&format=png`;
}

export default Index;

