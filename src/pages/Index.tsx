import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Banknote,
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
  useTopDeputadosAno,
  useTopEmendasPorPaisAno,
  useTopGeralAno,
  useTopGastadoresAno,
  useTopSenadoresAno,
} from "@/hooks/useRankings";
import { graphqlRequest } from "@/api/graphqlClient";
import { POLITICOS_LIST_QUERY } from "@/api/queries";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  toBigInt,
} from "@/lib/formatters";
import type { Connection, PoliticoResumo, TopGastadorEmenda } from "@/api/types";

const PAGE_SIZE = 20;
const rankIcons = [Crown, Trophy, Medal];

const years = Array.from({ length: 8 }, (_, i) => 2026 - i);

type TabId = "parlamentares" | "deputados" | "senadores" | "geral";

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "parlamentares", label: "Top 30 Parlamentares", icon: BarChart3 },
  { id: "deputados", label: "Top 30 Deputados", icon: Users },
  { id: "senadores", label: "Top 30 Senadores", icon: Landmark },
  { id: "geral", label: "Geral (todos os autores)", icon: Globe },
];

const tabTitles: Record<TabId, string> = {
  parlamentares: "Top 30 parlamentares",
  deputados: "Top deputados",
  senadores: "Top senadores",
  geral: "Top geral (inclui bancadas/comissoes/partidos)",
};

const featuredFallback = [
  {
    key: "lula",
    search: "lula",
    nomeCanonico: "lula",
    nome: "Luiz Inacio Lula da Silva",
    foto: "https://upload.wikimedia.org/wikipedia/commons/8/86/Lula_-_foto_oficial_2023-01-09.jpg",
  },
  {
    key: "bolsonaro",
    search: "bolsonaro",
    nomeCanonico: "bolsonaro",
    nome: "Jair Messias Bolsonaro",
    foto: "https://upload.wikimedia.org/wikipedia/commons/9/93/Jair_Bolsonaro_2019_Portrait.jpg",
  },
  {
    key: "arthurLira",
    search: "arthur lira",
    nomeCanonico: "arthur-lira",
    nome: "Arthur Lira",
    foto: "https://www.camara.leg.br/internet/deputado/bandep/160594.jpg",
  },
  {
    key: "daviAlcolumbre",
    search: "davi alcolumbre",
    nomeCanonico: "davi-alcolumbre",
    nome: "Davi Alcolumbre",
    foto: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5765.jpg",
  },
  {
    key: "flavioDino",
    search: "flavio dino",
    nomeCanonico: "flavio-dino",
    nome: "Flavio Dino",
    foto: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Flavio_Dino_%28cropped%29.jpg",
  },
  {
    key: "simoneTebet",
    search: "simone tebet",
    nomeCanonico: "simone-tebet",
    nome: "Simone Tebet",
    foto: "https://upload.wikimedia.org/wikipedia/commons/8/89/Simone_Tebet_%28cropped%29.jpg",
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("parlamentares");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [offset, setOffset] = useState(0);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiHealthQuery = useApiHealth();
  const featuredQuery = useFeaturedPoliticos();

  const parlamentaresQuery = useTopGastadoresAno(selectedYear);
  const deputadosQuery = useTopDeputadosAno(selectedYear);
  const senadoresQuery = useTopSenadoresAno(selectedYear);
  const geralQuery = useTopGeralAno(selectedYear);
  const paisesQuery = useTopEmendasPorPaisAno(selectedYear, { limit: 10, offset: 0 });

  const activeQueryMap = {
    parlamentares: parlamentaresQuery,
    deputados: deputadosQuery,
    senadores: senadoresQuery,
    geral: geralQuery,
  };

  const activeQuery = activeQueryMap[activeTab];

  const searchQuery = usePoliticos(
    searchTerm ? { search: searchTerm } : undefined,
    { limit: PAGE_SIZE, offset }
  );

  const isSearching = Boolean(searchTerm);
  const rawRankingNodes = (activeQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [];
  const rankingNodes = useMemo(() => {
    return rawRankingNodes.slice(offset, offset + PAGE_SIZE);
  }, [offset, rawRankingNodes]);

  const totalPagoCents = useMemo(
    () => rankingNodes.reduce((acc, node) => acc + toBigInt(node.totalPagoCents), 0n),
    [rankingNodes]
  );

  const totalPago = formatCents(totalPagoCents.toString());
  const totalPagoCompact = formatCentsCompact(totalPagoCents.toString());
  const totalEmendas = rankingNodes.reduce((acc, node) => acc + (node.totalEmendas || 0), 0);
  const mediaPagoPorEmenda =
    totalEmendas > 0 ? formatCents((totalPagoCents / BigInt(totalEmendas)).toString()) : "R$ 0,00";
  const mediaPagoPorEmendaCompact =
    totalEmendas > 0
      ? formatCentsCompact((totalPagoCents / BigInt(totalEmendas)).toString())
      : "R$ 0,00";

  const graficoTop = useMemo(
    () =>
      rankingNodes.slice(0, 6).map((node) => ({
        nome: shortName(node.nomeAutorEmenda),
        valor: centsToNumber(node.totalPagoCents),
      })),
    [rankingNodes]
  );

  const topPais = paisesQuery.data?.nodes?.[0];
  const featuredPhotoMap = useMemo<Record<string, string>>(
    () => Object.fromEntries(featuredFallback.map((item) => [item.key, item.foto])),
    []
  );
  const featuredFallbackMap = useMemo(
    () => Object.fromEntries(featuredFallback.map((item) => [item.key, item])),
    []
  );
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
    : rawRankingNodes.length;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;

  useEffect(() => {
    if (isSearching) {
      const nextOffset = offset + PAGE_SIZE;
      const nextPagination = { limit: PAGE_SIZE, offset: nextOffset };
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
  }, [
    isSearching,
    offset,
    queryClient,
    searchQuery.data,
    searchTerm,
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
                  Emendas, gastos publicos e perfis politicos em uma leitura mais clara e direta.
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
              placeholder="Digite nome ou partido"
              submitLabel="Consultar"
              autoSearch
              debounceMs={300}
            />
          </section>

          {!isSearching ? (
            <section className="mt-8 rounded-3xl border border-border/75 bg-card/85 p-6 shadow-card sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold sm:text-lg">Top buscas</h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Perfis acessados com mais frequencia.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/busca")}
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  <Search className="h-3.5 w-3.5" />
                  Abrir busca completa
                </button>
              </div>

              <div className="mt-5 overflow-x-auto overscroll-x-contain">
                <div className="flex min-w-max gap-3 pb-1">
                {featuredPoliticos.slice(0, 4).map((perfil) => {
                  const politico = perfil.politico;
                  const fallbackPerfil = featuredFallbackMap[perfil.key];
                  const nome =
                    politico?.nomeCompleto || politico?.nomeCanonico || fallbackPerfil?.nome || perfil.search;
                  const profileSlug = politico?.nomeCanonico || fallbackPerfil?.nomeCanonico;
                  const imageCandidates = buildImageCandidates(
                    politico?.fotoUrl,
                    featuredPhotoMap[perfil.key],
                    buildAvatarUrl(nome)
                  );

                  return (
                    <FeaturedPoliticoCard
                      key={perfil.key}
                      nome={nome}
                      imageCandidates={imageCandidates}
                      onClick={() =>
                        profileSlug
                          ? navigate(`/politico/${encodeURIComponent(profileSlug)}`)
                          : handleSearch(perfil.search)
                      }
                    />
                  );
                })}
                </div>
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
                  value={totalPagoCompact}
                  helper={totalPago}
                  description={`${tabTitles[activeTab]} ${selectedYear}`}
                  icon={Banknote}
                  variant="green"
                />
                <StatsCard
                  label="Registros no ranking"
                  value={formatCountCompact(total)}
                  helper={total.toLocaleString("pt-BR")}
                  description="Autores listados no recorte"
                  icon={Users}
                  variant="blue"
                />
                <StatsCard
                  label="Total emendas"
                  value={formatCountCompact(totalEmendas)}
                  helper={totalEmendas.toLocaleString("pt-BR")}
                  description="Emendas somadas no recorte"
                  icon={BarChart3}
                  variant="yellow"
                />
                <StatsCard
                  label="Ticket por emenda"
                  value={mediaPagoPorEmendaCompact}
                  helper={mediaPagoPorEmenda}
                  description="Media por emenda"
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
                  {activeQuery.isLoading ? (
                    <LoadingState message="Carregando ranking da API..." />
                  ) : null}
                  {activeQuery.error ? <ErrorState error={activeQuery.error as Error} /> : null}
                  {!activeQuery.isLoading &&
                  !activeQuery.error &&
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
                          <div className="text-right">
                            <p className="text-xs font-bold text-primary">
                              {formatCentsCompact(pais.totalPagoCents)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatCents(pais.totalPagoCents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {topPais ? (
                      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                        Lider do ano: <strong>{topPais.pais}</strong> com{" "}
                        <strong>{formatCentsCompact(topPais.totalPagoCents)}</strong>.
                      </div>
                    ) : null}
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
          <p className="text-sm font-extrabold text-primary">{formatCentsCompact(node.totalPagoCents)}</p>
          <p className="text-[10px] text-muted-foreground">{formatCents(node.totalPagoCents)}</p>
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

const FeaturedPoliticoCard = ({
  nome,
  imageCandidates,
  onClick,
}: {
  nome: string;
  imageCandidates: string[];
  onClick: () => void;
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const safeIndex = Math.min(imageIndex, Math.max(imageCandidates.length - 1, 0));
  const imageUrl = imageCandidates[safeIndex] || buildAvatarUrl(nome);

  return (
    <button
      onClick={onClick}
      className="flex min-w-[250px] items-center gap-3 rounded-2xl border border-border/80 bg-background/90 px-3 py-3 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated sm:min-w-[280px]"
    >
      <img
        src={imageUrl}
        alt={nome}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() =>
          setImageIndex((current) =>
            current < imageCandidates.length - 1 ? current + 1 : current
          )
        }
        className="h-12 w-12 flex-shrink-0 rounded-full border border-border object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-foreground sm:text-xs">
          {nome}
        </p>
        <p className="text-[10px] text-muted-foreground">Abrir perfil completo</p>
      </div>
    </button>
  );
};

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

function buildImageCandidates(...values: Array<string | undefined>) {
  return values.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

export default Index;

