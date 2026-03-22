import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Banknote,
  Crown,
  Globe,
  Landmark,
  Medal,
  PieChart as PieChartIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";

import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
import SearchBar from "@/components/SearchBar";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  useApiHealth,
  useFeaturedPoliticos,
  usePoliticos,
} from "@/hooks/usePoliticos";
import {
  isBancadaNome,
  useEmendaRankingResumo,
  useTopEmendasPorPaisCustom,
  useTopGastadoresCustom,
  useTopTiposCustom,
} from "@/hooks/useRankings";
import { graphqlRequest } from "@/api/graphqlClient";
import { POLITICOS_LIST_QUERY } from "@/api/queries";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
} from "@/lib/formatters";
import type {
  Connection,
  PoliticoResumo,
  RankingEmendaFiltroInput,
  TopGastadorEmenda,
} from "@/api/types";

const PAGE_SIZE = 20;
const rankIcons = [Crown, Trophy, Medal];
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_HOME_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const typeChartColors = ["#0f766e", "#2563eb", "#14b8a6", "#f59e0b"];

type TabId = "parlamentares" | "deputados" | "senadores" | "geral";

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "parlamentares", label: "Top 30 Parlamentares", icon: BarChart3 },
  { id: "deputados", label: "Top 30 Deputados", icon: Users },
  { id: "senadores", label: "Top 30 Senadores", icon: Landmark },
  { id: "geral", label: "Geral (todos os autores)", icon: Globe },
];

const tabTitles: Record<TabId, { title: string; helper: string }> = {
  parlamentares: {
    title: "Parlamentares em destaque",
    helper: "Recorte parlamentar principal, sem bancadas e blocos.",
  },
  deputados: {
    title: "Deputados com maior volume",
    helper: "Foco nos autores com cargo atual de deputado.",
  },
  senadores: {
    title: "Senadores com maior volume",
    helper: "Foco nos autores com cargo atual de senador.",
  },
  geral: {
    title: "Autores em destaque no geral",
    helper: "Inclui politicos, bancadas, blocos, comissoes e outros autores.",
  },
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
  const [selectedYear, setSelectedYear] = useState(DEFAULT_HOME_YEAR);
  const [offset, setOffset] = useState(0);
  const [openingProfile, setOpeningProfile] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiHealthQuery = useApiHealth();
  const featuredQuery = useFeaturedPoliticos();

  const rankingFilter = useMemo<RankingEmendaFiltroInput>(() => {
    const base: RankingEmendaFiltroInput = {
      anoInicio: selectedYear,
      anoFim: selectedYear,
    };

    if (activeTab === "parlamentares") {
      return { ...base, apenasParlamentares: true };
    }

    if (activeTab === "deputados") {
      return { ...base, apenasParlamentares: true, cargoParlamentar: "DEPUTADO" };
    }

    if (activeTab === "senadores") {
      return { ...base, apenasParlamentares: true, cargoParlamentar: "SENADOR" };
    }

    return { ...base, apenasParlamentares: false };
  }, [activeTab, selectedYear]);

  const resumoQuery = useEmendaRankingResumo(rankingFilter);
  const activeQuery = useTopGastadoresCustom(rankingFilter, { limit: PAGE_SIZE, offset });
  const leadersQuery = useTopGastadoresCustom(rankingFilter, { limit: 3, offset: 0 });
  const tiposQuery = useTopTiposCustom(rankingFilter, { limit: 4, offset: 0 });
  const paisesQuery = useTopEmendasPorPaisCustom(rankingFilter, { limit: 5, offset: 0 });

  const searchQuery = usePoliticos(
    searchTerm ? { search: searchTerm } : undefined,
    { limit: PAGE_SIZE, offset }
  );

  const isSearching = Boolean(searchTerm);
  const resumo = resumoQuery.data;
  const rankingNodes = (activeQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [];
  const leaderNodes = (leadersQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [];
  const displayRankingNodes = useMemo(
    () => (offset === 0 ? rankingNodes.slice(1) : rankingNodes),
    [offset, rankingNodes]
  );
  const typeChartData = useMemo(() => {
    const nodes = tiposQuery.data?.nodes ?? [];
    const totalValue = nodes.reduce((acc, item) => acc + centsToNumber(item.totalPagoCents), 0);

    return nodes.map((item, index) => {
      const value = centsToNumber(item.totalPagoCents);
      return {
        nome: item.tipoEmenda || "Nao informado",
        value,
        color: typeChartColors[index % typeChartColors.length],
        totalEmendas: item.totalEmendas ?? 0,
        share: totalValue > 0 ? (value / totalValue) * 100 : 0,
      };
    });
  }, [tiposQuery.data?.nodes]);
  const leader = leaderNodes[0];
  const leadShare =
    leader && centsToNumber(resumo?.totalPagoCents) > 0
      ? (centsToNumber(leader.totalPagoCents) / centsToNumber(resumo?.totalPagoCents)) * 100
      : 0;
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

  const handleOpenPoliticoProfile = async (node: TopGastadorEmenda) => {
    const authorName = node.nomeAutorEmenda?.trim();
    if (!authorName || !canOpenPoliticoProfile(node)) {
      return;
    }

    setOpeningProfile(authorName);

    try {
      const connection = await queryClient.fetchQuery({
        queryKey: ["home-ranking-politico", authorName],
        queryFn: ({ signal }) =>
          graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
            POLITICOS_LIST_QUERY,
            {
              filter: { search: authorName },
              pagination: { limit: 6, offset: 0 },
            },
            { signal, timeoutMs: 10_000 }
          ).then((data) => data.politicos),
        staleTime: 15 * 60_000,
      });

      const match = selectPoliticoMatch(connection.nodes, authorName);
      if (match?.nomeCanonico || match?.id) {
        navigate(`/politico/${encodeURIComponent(match.nomeCanonico || match.id)}`);
      }
    } finally {
      setOpeningProfile((current) => (current === authorName ? null : current));
    }
  };

  const total = isSearching
    ? searchQuery.data?.total ?? 0
    : activeQuery.data?.total ?? 0;

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
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
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
              <section className="mt-8 rounded-[32px] border border-border/75 bg-card/90 p-6 shadow-card sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Leitura anual de emendas
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {tabTitles[activeTab].title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {tabTitles[activeTab].helper} A home fica focada no ano selecionado, com
                      destaque para autores, tipos de emenda e localidade de aplicacao.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <HomeBriefCard
                      label="Ano em foco"
                      value={String(selectedYear)}
                      helper="Recorte principal da home"
                    />
                    <HomeBriefCard
                      label="Escopo"
                      value={tabs.find((tab) => tab.id === activeTab)?.label.replace("Top 30 ", "") || "-"}
                      helper={tabTitles[activeTab].helper}
                    />
                    <HomeBriefCard
                      label="Lider do ano"
                      value={shortName(leader?.nomeAutorEmenda)}
                      helper={
                        leader
                          ? `${formatCentsCompact(leader.totalPagoCents)} pagos`
                          : "Sem lideranca consolidada"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto overscroll-x-contain">
                  <div className="flex min-w-max gap-2 pb-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                          tab.id === activeTab
                            ? "border-primary/30 bg-gradient-hero text-primary-foreground shadow-glow"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                  label="Total pago"
                  value={formatCentsCompact(resumo?.totalPagoCents)}
                  helper={formatCents(resumo?.totalPagoCents)}
                  description={`${selectedYear} - ${tabs.find((tab) => tab.id === activeTab)?.label ?? ""}`}
                  icon={Banknote}
                  variant="green"
                />
                <StatsCard
                  label="Autores distintos"
                  value={formatCountCompact(resumo?.totalAutores ?? 0)}
                  helper={(resumo?.totalAutores ?? 0).toLocaleString("pt-BR")}
                  description="Autores ou grupos encontrados no recorte"
                  icon={Users}
                  variant="blue"
                />
                <StatsCard
                  label="Total emendas"
                  value={formatCountCompact(resumo?.totalEmendas ?? 0)}
                  helper={(resumo?.totalEmendas ?? 0).toLocaleString("pt-BR")}
                  description="Registros consolidados para o ano"
                  icon={BarChart3}
                  variant="yellow"
                />
                <StatsCard
                  label="Ticket por emenda"
                  value={formatCentsCompact(resumo?.ticketMedioPagoCents)}
                  helper={formatCents(resumo?.ticketMedioPagoCents)}
                  description={`${formatCountCompact(resumo?.totalTipos ?? 0)} tipos e ${formatCountCompact(resumo?.totalPaises ?? 0)} paises`}
                  icon={ShieldCheck}
                  variant="blue"
                />
              </section>

              <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
                <div className="space-y-6">
                  {leader ? (
                    <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card sm:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                            <Crown className="h-3.5 w-3.5" />
                            Maior volume pago no ano
                          </p>
                          {canOpenPoliticoProfile(leader) ? (
                            <button
                              type="button"
                              onClick={() => void handleOpenPoliticoProfile(leader)}
                              className="mt-3 inline-flex items-center gap-2 text-left text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
                            >
                              <span className="truncate">{leader.nomeAutorEmenda}</span>
                              <ArrowUpRight className="h-4 w-4 shrink-0" />
                            </button>
                          ) : (
                            <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                              {leader.nomeAutorEmenda}
                            </h3>
                          )}
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            {canOpenPoliticoProfile(leader)
                              ? "Clique no nome para abrir o perfil completo do autor quando houver identificacao individual."
                              : "Esse destaque representa bancada, grupo ou autoria sem perfil individual publico resolvido."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {leaderNodes.slice(1, 3).map((node, index) => (
                              <span
                                key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${index}`}
                                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground"
                              >
                                <span className="font-semibold text-foreground">
                                  #{index + 2} {shortName(node.nomeAutorEmenda)}
                                </span>
                                <span>{formatCentsCompact(node.totalPagoCents)}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[430px]">
                          <HighlightMetric
                            label="Pago"
                            value={formatCentsCompact(leader.totalPagoCents)}
                            helper={formatCents(leader.totalPagoCents)}
                            tone="primary"
                          />
                          <HighlightMetric
                            label="Emendas"
                            value={formatCountCompact(leader.totalEmendas ?? 0)}
                            helper={`${(leader.totalEmendas ?? 0).toLocaleString("pt-BR")} registros`}
                          />
                          <HighlightMetric
                            label="Participacao"
                            value={`${leadShare.toFixed(1)}%`}
                            helper="Do total pago do recorte"
                          />
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Principais autores do ano</h2>
                        <p className="text-sm text-muted-foreground">
                          Clique no nome quando houver perfil individual identificado.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                        {formatCountCompact(total)} autores no ranking
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {activeQuery.isLoading ? <LoadingState message="Carregando ranking da API..." /> : null}
                      {activeQuery.error ? <ErrorState error={activeQuery.error as Error} /> : null}
                      {!activeQuery.isLoading && !activeQuery.error && rankingNodes.length === 0 ? (
                        <EmptyState message="A API nao retornou ranking para este ano." />
                      ) : null}

                      {displayRankingNodes.map((node, index) => {
                        const rank = offset === 0 ? index + 2 : offset + index + 1;
                        return (
                          <RankingRow
                            key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${rank}`}
                            node={node}
                            rank={rank}
                            canOpenProfile={canOpenPoliticoProfile(node)}
                            openingProfile={openingProfile === node.nomeAutorEmenda}
                            onOpenProfile={() => void handleOpenPoliticoProfile(node)}
                          />
                        );
                      })}
                    </div>

                    {total > 0 ? (
                      <PaginationControls
                        total={total}
                        limit={PAGE_SIZE}
                        offset={offset}
                        onPageChange={setOffset}
                        itemLabel="autores"
                      />
                    ) : null}
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card sm:p-6">
                    <div className="mb-5">
                      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <PieChartIcon className="h-4.5 w-4.5 text-primary" />
                        Composicao por tipo
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Distribuicao do valor pago entre os tipos mais relevantes do recorte.
                      </p>
                    </div>

                    {tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                    {tiposQuery.error ? <ErrorState error={tiposQuery.error as Error} /> : null}
                    {!tiposQuery.isLoading && !tiposQuery.error && !typeChartData.length ? (
                      <EmptyState message="Sem tipos suficientes para montar a leitura." />
                    ) : null}

                    {typeChartData.length ? (
                      <div className="space-y-4">
                        <div className="mx-auto h-[220px] w-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={typeChartData}
                                dataKey="value"
                                nameKey="nome"
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={92}
                                paddingAngle={2}
                              >
                                {typeChartData.map((item) => (
                                  <Cell key={item.nome} fill={item.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value: number) =>
                                  value.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                    maximumFractionDigits: 0,
                                  })
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-2">
                          {typeChartData.map((item) => (
                            <div
                              key={item.nome}
                              className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="mt-0.5 h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {item.nome}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatCountCompact(item.totalEmendas)} emendas
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">
                                  {formatCentsCompact(String(Math.round(item.value * 100)))}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {item.share.toFixed(1)}% do pago
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card sm:p-6">
                    <div className="mb-4">
                      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Globe className="h-4.5 w-4.5 text-accent" />
                        Paises e localidade
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Onde o recorte se concentrou quando observamos a localidade de aplicacao.
                      </p>
                    </div>

                    {paisesQuery.isLoading ? <LoadingState message="Carregando recorte por pais..." /> : null}
                    {paisesQuery.error ? <ErrorState error={paisesQuery.error as Error} /> : null}
                    {!paisesQuery.isLoading && !paisesQuery.error && !paisesQuery.data?.nodes.length ? (
                      <EmptyState message="Sem dados por pais no ano selecionado." />
                    ) : null}

                    <div className="space-y-2">
                      {paisesQuery.data?.nodes.slice(0, 5).map((pais, index) => (
                        <div
                          key={`${pais.pais}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {index + 1}. {pais.pais}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCountCompact(pais.totalEmendas ?? 0)} emendas
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">
                              {formatCentsCompact(pais.totalPagoCents)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatCents(pais.totalPagoCents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {topPais ? (
                      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                        Lider do ano: <strong>{topPais.pais}</strong> com{" "}
                        <strong>{formatCentsCompact(topPais.totalPagoCents)}</strong>.
                      </div>
                    ) : null}
                  </section>
                </div>
              </section>
            </>
          )}
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

const HomeBriefCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-card">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-base font-bold text-foreground">{value}</p>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
  </div>
);

const HighlightMetric = ({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "primary";
}) => (
  <div
    className={`rounded-[22px] border px-3 py-3 ${
      tone === "primary"
        ? "border-primary/25 bg-primary/10"
        : "border-border/70 bg-background/80"
    }`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </p>
    <p className={`mt-1 text-sm font-bold ${tone === "primary" ? "text-primary" : "text-foreground"}`}>
      {value}
    </p>
    <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
  </div>
);

const RankingRow = ({
  node,
  rank,
  canOpenProfile,
  openingProfile,
  onOpenProfile,
}: {
  node: TopGastadorEmenda;
  rank: number;
  canOpenProfile: boolean;
  openingProfile?: boolean;
  onOpenProfile: () => void;
}) => {
  const Icon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <article className="rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-soft text-primary">
            {Icon ? <Icon className="h-4.5 w-4.5" /> : <span className="text-xs font-bold">#{rank}</span>}
          </div>

          <div className="min-w-0 flex-1">
            {canOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                disabled={openingProfile}
                className="inline-flex max-w-full items-center gap-2 text-left text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary disabled:cursor-wait disabled:opacity-70"
              >
                <span className="truncate">{node.nomeAutorEmenda}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            ) : (
              <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                {node.nomeAutorEmenda}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                {formatCountCompact(node.totalEmendas ?? 0)} emendas
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  canOpenProfile
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {canOpenProfile
                  ? openingProfile
                    ? "Abrindo perfil..."
                    : "Perfil completo"
                  : "Sem perfil individual"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          <HighlightMetric
            label="Pago"
            value={formatCentsCompact(node.totalPagoCents)}
            helper={formatCents(node.totalPagoCents)}
            tone="primary"
          />
          <HighlightMetric
            label="Empenhado"
            value={formatCentsCompact(node.totalEmpenhadoCents)}
            helper={formatCents(node.totalEmpenhadoCents)}
          />
          <HighlightMetric
            label="Liquidado"
            value={formatCentsCompact(node.totalLiquidadoCents)}
            helper={formatCents(node.totalLiquidadoCents)}
          />
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

function normalizeComparableName(value?: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyComparable(value?: string): string {
  return normalizeComparableName(value).replace(/\s+/g, "-");
}

function canOpenPoliticoProfile(node?: TopGastadorEmenda): boolean {
  const name = node?.nomeAutorEmenda?.trim();
  return Boolean(name && !isBancadaNome(name) && normalizeComparableName(name).length >= 5);
}

function selectPoliticoMatch(nodes: PoliticoResumo[], authorName: string): PoliticoResumo | undefined {
  const normalizedAuthor = normalizeComparableName(authorName);
  const authorSlug = slugifyComparable(authorName);

  const exactMatch = nodes.find((node) => {
    const normalizedFullName = normalizeComparableName(node.nomeCompleto);
    const normalizedCanonico = normalizeComparableName((node.nomeCanonico || "").replace(/-/g, " "));
    const slug = slugifyComparable(node.nomeCanonico || node.nomeCompleto || node.id);

    return (
      normalizedFullName === normalizedAuthor ||
      normalizedCanonico === normalizedAuthor ||
      slug === authorSlug
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  return undefined;
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

