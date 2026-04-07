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
import { motion, useReducedMotion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import AppSidebar from "@/components/AppSidebar";
import EditorialSection from "@/components/EditorialSection";
import ImpostometroSpotlight from "@/components/ImpostometroSpotlight";
import PaginationControls from "@/components/PaginationControls";
import SeoHead from "@/components/SeoHead";
import ShareActions from "@/components/ShareActions";
import SearchBar from "@/components/SearchBar";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  useApiHealth,
  useFeaturedPoliticos,
  usePoliticos,
} from "@/hooks/usePoliticos";
import { useImpostometroResumo } from "@/hooks/useImpostometro";
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
import { buildPoliticoPath } from "@/lib/politicos";
import {
  SEO_SITE_NAME,
  buildBreadcrumbStructuredData,
  buildCanonicalUrl,
  truncateSeoDescription,
} from "@/lib/seo";
import { buildRevealVariants, buildStaggerVariants, editorialViewport } from "@/lib/motion";
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
    foto: "https://imagens.ebc.com.br/f0xBJtGd9zN4rfk4F1Yt8BZBv6I=/1170x700/smart/https://agenciabrasil.ebc.com.br/sites/default/files/thumbnails/image/2025/09/06/54770136894_59403684a2_o.jpg",
  },
  {
    key: "bolsonaro",
    search: "bolsonaro",
    nomeCanonico: "bolsonaro",
    nome: "Jair Messias Bolsonaro",
    foto: "https://commons.wikimedia.org/wiki/Special:FilePath/Jair%20Bolsonaro%202019%20Portrait%20(3x4%20cropped%20center).jpg",
  },
  {
    key: "arthurLira",
    search: "arthur lira",
    nomeCanonico: "arthur-lira",
    nome: "Arthur Lira",
    foto: "https://www.camara.leg.br/internet/deputado/bandep/160541.jpg",
  },
  {
    key: "daviAlcolumbre",
    search: "davi alcolumbre",
    nomeCanonico: "davi-alcolumbre",
    nome: "Davi Alcolumbre",
    foto: "https://www12.senado.leg.br/institucional/presidencia/img/davi_alcolumbre_presidente.jpg",
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
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabId>("parlamentares");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(DEFAULT_HOME_YEAR);
  const [offset, setOffset] = useState(0);
  const [openingProfile, setOpeningProfile] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiHealthQuery = useApiHealth();
  const impostometroQuery = useImpostometroResumo();
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
  const topTipo = typeChartData[0];
  const leaderToTicketRatio =
    leader && centsToNumber(resumo?.ticketMedioPagoCents) > 0
      ? centsToNumber(leader.totalPagoCents) / centsToNumber(resumo?.ticketMedioPagoCents)
      : 0;
  const leaderRunnersUp = leaderNodes.slice(1, 3);
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
  const featuredShelf = useMemo(
    () =>
      featuredPoliticos.slice(0, 4).map((perfil) => {
        const politico = perfil.politico;
        const fallbackPerfil = featuredFallbackMap[perfil.key];
        const nome =
          politico?.nomeCompleto || politico?.nomeCanonico || fallbackPerfil?.nome || perfil.search;
        const profilePath = buildPoliticoPath({
          nomeCompleto: politico?.nomeCompleto || fallbackPerfil?.nome || perfil.search,
          nomeCanonico: politico?.nomeCanonico || fallbackPerfil?.nomeCanonico,
          id: politico?.id,
        });

        return {
          key: perfil.key,
          nome,
          profilePath,
          search: perfil.search,
          imageCandidates: buildImageCandidates(
            featuredPhotoMap[perfil.key],
            politico?.fotoUrl,
            buildAvatarUrl(nome)
          ),
        };
      }),
    [featuredFallbackMap, featuredPhotoMap, featuredPoliticos]
  );
  const featuredPrimary = featuredShelf[0];
  const featuredSecondary = featuredShelf.slice(1);
  const homeSeoDescription = truncateSeoDescription(
    "Consulte viagens oficiais, emendas parlamentares, rankings comparativos e perfis politicos em uma leitura clara orientada por dados publicos."
  );
  const homeStructuredData = useMemo(
    () => {
      const featuredItemList = featuredShelf.slice(0, 4).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: buildCanonicalUrl(item.profilePath),
        name: item.nome,
      }));

      return [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SEO_SITE_NAME,
          url: "https://radardopovo.com",
          logo: "https://radardopovo.com/logo.png",
          email: "radardopovo@proton.me",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SEO_SITE_NAME,
          url: "https://radardopovo.com",
          inLanguage: "pt-BR",
        },
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Radar do Povo",
          url: "https://radardopovo.com/",
          description: homeSeoDescription,
          inLanguage: "pt-BR",
          isPartOf: {
            "@type": "WebSite",
            name: SEO_SITE_NAME,
            url: "https://radardopovo.com",
          },
          about: [
            { "@type": "Thing", name: "Transparencia politica" },
            { "@type": "Thing", name: "Emendas parlamentares" },
            { "@type": "Thing", name: "Viagens oficiais" },
          ],
        },
        buildBreadcrumbStructuredData([{ name: "Home", path: "/" }]),
        ...(featuredItemList.length
          ? [
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: "Perfis politicos em destaque",
                itemListElement: featuredItemList,
              },
            ]
          : []),
      ];
    },
    [featuredShelf, homeSeoDescription]
  );

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
      if (match?.nomeCanonico || match?.id || match?.nomeCompleto) {
        navigate(
          buildPoliticoPath({
            nomeCompleto: match?.nomeCompleto || authorName,
            nomeCanonico: match?.nomeCanonico,
            id: match?.id,
          })
        );
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
      <SeoHead
        title="Radar do Povo | Transparencia politica em dados publicos"
        description={homeSeoDescription}
        path="/"
        keywords={[
          "radar do povo",
          "transparencia politica",
          "emendas parlamentares",
          "viagens oficiais",
          "perfis politicos",
          "gastos publicos",
        ]}
        structuredData={homeStructuredData}
      />
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:pt-10">

          {/* ── Hero ── */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={buildRevealVariants(Boolean(reduceMotion))}
            className="editorial-hero px-7 py-8 sm:px-10 sm:py-10"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-[52%] w-px bg-gradient-to-b from-transparent via-slate-200/80 to-transparent" />
              <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
              <div className="animate-float-wide absolute -right-20 top-8 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
              <div className="animate-float-slow absolute right-20 top-10 h-36 w-36 rounded-full border border-primary/10" />
              <div className="absolute left-[10%] top-8 h-24 w-24 rounded-full border border-slate-200/90" />
            </div>

            <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] xl:items-center">
              <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 14 })}>
                <p className="editorial-eyebrow mb-3">
                  <Sparkles className="h-3 w-3" />
                  Painel de transparencia
                </p>
                <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-[2.8rem]">
                  Radar do Povo{" "}
                  <span className="text-gradient-primary">orientado por dados</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  Leitura institucional de emendas, viagens oficiais e perfis politicos, com menos ruido e mais criterio na comparacao dos dados.
                </p>
              </motion.div>

              <motion.div
                variants={buildRevealVariants(Boolean(reduceMotion), { y: 14, delay: 0.03 })}
                className="grid gap-3 xl:justify-items-end"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge
                    status={apiHealthQuery.data?.status}
                    loading={apiHealthQuery.isLoading}
                  />

                  <label className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-3 py-2 text-xs font-semibold text-foreground shadow-card backdrop-blur-sm">
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

                <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[460px]">
                  <HeroSignalTile
                    icon={Banknote}
                    label="Emendas"
                    value={formatCentsCompact(resumo?.totalPagoCents)}
                    helper="Volume pago no recorte"
                  />
                  <HeroSignalTile
                    icon={Users}
                    label="Perfis"
                    value={formatCountCompact(resumo?.totalAutores)}
                    helper="Autores distintos"
                  />
                  <HeroSignalTile
                    icon={Globe}
                    label="Paises"
                    value={formatCountCompact(resumo?.totalPaises)}
                    helper="Localidade registrada"
                  />
                </div>
              </motion.div>
            </div>
          </motion.section>

          <EditorialSection tone="strong" className="mt-6 px-0 py-0" delay={0.04}>
            <ImpostometroSpotlight
              data={impostometroQuery.data}
              isLoading={impostometroQuery.isLoading}
              isError={Boolean(impostometroQuery.error)}
            />
          </EditorialSection>

          {/* ── Search ── */}
          <EditorialSection tone="strong" className="mt-6 px-4 py-4 sm:px-5" delay={0.08}>
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />
              </div>

              <div className="relative">
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isSearching && searchQuery.isLoading}
                  placeholder="Digite nome ou partido"
                  submitLabel="Consultar"
                  autoSearch
                  debounceMs={300}
                />
              </div>
            </div>
          </EditorialSection>

          {/* ── Featured shelf ── */}
          {!isSearching ? (
            <EditorialSection className="mt-6 overflow-hidden px-0 py-0" delay={0.11}>
              <div className="border-b border-border px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Top buscas</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Perfis acessados com mais frequencia.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <button
                      onClick={() => navigate("/busca")}
                      className="inline-flex items-center gap-1.5 rounded-[1rem] border border-border/75 bg-white/88 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/18 hover:text-primary"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Busca completa
                    </button>

                    {featuredPrimary ? (
                      <ShareActions
                        label="Compartilhar destaque"
                        title={`${featuredPrimary.nome} | Radar do Povo`}
                        text={`Veja o perfil completo de ${featuredPrimary.nome} no Radar do Povo.`}
                        url={buildPublicUrl(featuredPrimary.profilePath)}
                        align="right"
                        compact
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                  {featuredPrimary ? (
                    <FeaturedPoliticoLeadCard
                      nome={featuredPrimary.nome}
                      imageCandidates={featuredPrimary.imageCandidates}
                      onClick={() =>
                        featuredPrimary.profilePath
                          ? navigate(featuredPrimary.profilePath)
                          : handleSearch(featuredPrimary.search)
                      }
                    />
                  ) : null}

                  <div className="overflow-x-auto overscroll-x-contain lg:overflow-visible">
                    <div className="flex min-w-max snap-x snap-mandatory gap-3 pb-1 lg:min-w-0 lg:flex-col">
                      {featuredSecondary.map((perfil) => (
                        <FeaturedPoliticoCard
                          key={perfil.key}
                          nome={perfil.nome}
                          imageCandidates={perfil.imageCandidates}
                          onClick={() =>
                            perfil.profilePath
                              ? navigate(perfil.profilePath)
                              : handleSearch(perfil.search)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </EditorialSection>
          ) : null}

          {/* ── Search results ── */}
          {isSearching ? (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={editorialViewport}
              variants={buildStaggerVariants(Boolean(reduceMotion))}
              className="mt-6 space-y-3"
            >
              {searchQuery.isLoading ? <LoadingState message="Buscando politicos na API..." /> : null}
              {searchQuery.error ? <ErrorState error={searchQuery.error as Error} /> : null}
              {!searchQuery.isLoading && !searchQuery.error && searchQuery.data?.nodes.length === 0 ? (
                <EmptyState message="Nenhum politico encontrado para este termo." />
              ) : null}

              {searchQuery.data?.nodes.map((politico) => (
                <motion.button
                  key={politico.id}
                  onClick={() => navigate(buildPoliticoPath(politico))}
                  variants={buildRevealVariants(Boolean(reduceMotion), { y: 10 })}
                  className="w-full text-left"
                >
                  <PoliticianSearchCard politico={politico} />
                </motion.button>
              ))}
            </motion.section>
          ) : (
            <>
              {/* ── Ranking header ── */}
              <EditorialSection className="mt-6 p-6 sm:p-7" delay={0.12}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-2xl">
                    <p className="editorial-eyebrow">
                      <Sparkles className="h-3 w-3" />
                      Leitura anual de emendas
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                      {tabTitles[activeTab].title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {tabTitles[activeTab].helper} Destaque para autores, tipos de emenda e
                      localidade de aplicacao no ano selecionado.
                    </p>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
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

                <div className="mt-6 overflow-x-auto overscroll-x-contain">
                  <div className="flex min-w-max gap-2 pb-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                          tab.id === activeTab
                            ? "border-primary bg-primary text-white"
                            : "border-border/75 bg-white/88 text-muted-foreground hover:border-primary/18 hover:text-foreground"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </EditorialSection>

              {/* ── Stats row ── */}
              <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="col-span-2 xl:col-span-1">
                  <StatsCard
                    label="Total pago"
                    value={formatCentsCompact(resumo?.totalPagoCents)}
                    helper={formatCents(resumo?.totalPagoCents)}
                    description={`${selectedYear} · ${tabs.find((tab) => tab.id === activeTab)?.label ?? ""}`}
                    icon={Banknote}
                    variant="green"
                  />
                </div>
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
                <div className="col-span-2 xl:col-span-1">
                  <StatsCard
                    label="Ticket por emenda"
                    value={formatCentsCompact(resumo?.ticketMedioPagoCents)}
                    helper={formatCents(resumo?.ticketMedioPagoCents)}
                    description={`${formatCountCompact(resumo?.totalTipos ?? 0)} tipos · ${formatCountCompact(resumo?.totalPaises ?? 0)} paises`}
                    icon={ShieldCheck}
                    variant="blue"
                  />
                </div>
              </section>

              {/* ── Main content ── */}
              <section className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
                <div className="space-y-4">

                  {/* Leader card */}
                  {leader ? (
                    <section className="editorial-panel overflow-hidden px-0 py-0">
                      <div className="border-b border-border px-5 py-5 sm:px-6">
                        <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                          <Crown className="h-3 w-3" />
                          Maior volume pago no ano
                        </p>

                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            {canOpenPoliticoProfile(leader) ? (
                              <button
                                type="button"
                                onClick={() => void handleOpenPoliticoProfile(leader)}
                                className="inline-flex max-w-full items-center gap-2 text-left text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
                              >
                                <span className="truncate">{leader.nomeAutorEmenda}</span>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
                              </button>
                            ) : (
                              <h3 className="text-xl font-bold tracking-tight text-foreground">
                                {leader.nomeAutorEmenda}
                              </h3>
                            )}
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {canOpenPoliticoProfile(leader)
                                ? "Perfil individual disponivel para abrir o dossie completo."
                                : "Autoria coletiva ou sem perfil individual publico resolvido."}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Valor pago
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                              {formatCentsCompact(leader.totalPagoCents)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatCents(leader.totalPagoCents)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-0 sm:grid-cols-[1fr_1px_300px]">
                        <div className="p-5 sm:p-6">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Emendas
                              </p>
                              <p className="mt-1.5 text-lg font-bold text-foreground">
                                {formatCountCompact(leader.totalEmendas ?? 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(leader.totalEmendas ?? 0).toLocaleString("pt-BR")} registros
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                vs. ticket medio
                              </p>
                              <p className="mt-1.5 text-lg font-bold text-foreground">
                                {leaderToTicketRatio > 0
                                  ? `${leaderToTicketRatio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x`
                                  : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ticket medio: {formatCentsCompact(resumo?.ticketMedioPagoCents)}
                              </p>
                            </div>
                          </div>

                          {leaderRunnersUp.length ? (
                            <div className="mt-5 border-t border-border pt-4">
                              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Proximos no ranking
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {leaderRunnersUp.map((node, index) => (
                                  <div
                                    key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${index}`}
                                    className="inline-flex min-w-[180px] items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-white/85 px-3 py-2.5 text-xs shadow-[0_10px_24px_-26px_rgba(15,23,42,0.4)]"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-foreground">
                                        #{index + 2} {shortName(node.nomeAutorEmenda)}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {formatCountCompact(node.totalEmendas ?? 0)} emendas
                                      </p>
                                    </div>
                                    <p className="font-bold text-primary">
                                      {formatCentsCompact(node.totalPagoCents)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="hidden sm:block bg-border/50" />

                        <div className="border-t border-border p-5 sm:border-t-0 sm:p-6">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Leitura do recorte
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {canOpenPoliticoProfile(leader)
                              ? "Perfil individual disponivel"
                              : "Autoria coletiva ou nao identificada"}
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            {leader.totalEmendas === 1
                              ? "Um unico registro concentra esse destaque no ano."
                              : `Esse autor concentra ${formatCountCompact(leader.totalEmendas ?? 0)} emendas no recorte analisado.`}
                          </p>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {/* Ranking list */}
                  <section className="editorial-panel p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-bold text-foreground">Principais autores do ano</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Clique no nome quando houver perfil individual identificado.
                        </p>
                      </div>
                      <div className="surface-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {formatCountCompact(total)} autores no ranking
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {activeQuery.isLoading ? <LoadingState message="Carregando ranking da API..." /> : null}
                      {activeQuery.error && rankingNodes.length === 0 ? <ErrorState error={activeQuery.error as Error} /> : null}
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

                {/* ── Sidebar ── */}
                <div className="space-y-4">

                  {/* Tipo chart */}
                  <section className="editorial-panel-soft p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-primary" />
                      <div>
                        <h2 className="text-base font-bold text-foreground">Composicao por tipo</h2>
                        <p className="text-xs text-muted-foreground">
                          Distribuicao do valor pago no recorte.
                        </p>
                      </div>
                    </div>

                    {tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                    {tiposQuery.error && !typeChartData.length ? <ErrorState error={tiposQuery.error as Error} /> : null}
                    {!tiposQuery.isLoading && !tiposQuery.error && !typeChartData.length ? (
                      <EmptyState message="Sem tipos suficientes para montar a leitura." />
                    ) : null}

                    {typeChartData.length ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto h-[176px] w-[176px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={typeChartData}
                                dataKey="value"
                                nameKey="nome"
                                cx="50%"
                                cy="50%"
                                innerRadius={54}
                                outerRadius={80}
                                paddingAngle={3}
                                stroke="transparent"
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
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                              {topTipo ? `${topTipo.share.toFixed(0)}%` : "—"}
                            </p>
                            <p className="mt-0.5 max-w-[96px] text-center text-[10px] font-medium leading-4 text-muted-foreground">
                              {compactTipoLabel(topTipo?.nome)}
                            </p>
                          </div>
                        </div>

                        {/* Bar summary */}
                        <div className="surface-muted p-4">
                          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                            <span>Distribuicao por valor pago</span>
                            <span>100%</span>
                          </div>
                          <div className="flex h-2 overflow-hidden rounded-full">
                            {typeChartData.map((item) => (
                              <div
                                key={`${item.nome}-seg`}
                                className="h-full first:rounded-l-full last:rounded-r-full"
                                style={{
                                  width: `${Math.max(item.share, 4)}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {typeChartData.map((item, index) => (
                            <div
                              key={item.nome}
                              className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-white/85 px-4 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-foreground">
                                    {compactTipoLabel(item.nome)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {formatCountCompact(item.totalEmendas)} emendas
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-primary">
                                  {formatCentsCompact(String(Math.round(item.value * 100)))}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {item.share.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* Paises */}
                  <section className="editorial-panel-soft p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <div>
                        <h2 className="text-base font-bold text-foreground">Paises e localidade</h2>
                        <p className="text-xs text-muted-foreground">
                          Concentracao geografica do recorte.
                        </p>
                      </div>
                    </div>

                    {paisesQuery.isLoading ? <LoadingState message="Carregando recorte por pais..." /> : null}
                    {paisesQuery.error && !(paisesQuery.data?.nodes?.length) ? <ErrorState error={paisesQuery.error as Error} /> : null}
                    {!paisesQuery.isLoading && !paisesQuery.error && !paisesQuery.data?.nodes.length ? (
                      <EmptyState message="Sem dados por pais no ano selecionado." />
                    ) : null}

                    <div className="space-y-2">
                      {paisesQuery.data?.nodes.slice(0, 5).map((pais, index) => (
                        <div
                          key={`${pais.pais}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-white/85 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {index + 1}. {pais.pais}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatCountCompact(pais.totalEmendas ?? 0)} emendas
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
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
                      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-xs text-foreground">
                        <span className="text-muted-foreground">Lider:</span>{" "}
                        <strong className="text-foreground">{topPais.pais}</strong>{" "}
                        <span className="text-muted-foreground">·</span>{" "}
                        <strong className="text-primary">{formatCentsCompact(topPais.totalPagoCents)}</strong>
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

/* ────────────────────────────────────────────────────── sub-components ── */

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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "degraded"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[11px] font-semibold ${tone}`}
    >
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
  <div className="surface-muted p-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-sm font-bold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{helper}</p>
  </div>
);

const HeroSignalTile = ({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="group relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/76 px-4 py-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/18">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />
    <div className="relative">
      <div className="flex items-center gap-2 text-primary">
        <span className="rounded-[0.9rem] bg-primary/10 p-2">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-base font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
    </div>
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
    <article className="rounded-[1.15rem] border border-border/75 bg-white/88 px-4 py-4 shadow-[0_18px_34px_-32px_rgba(15,23,42,0.35)] transition-all duration-150 hover:border-primary/18 hover:bg-primary/[0.03]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[0.9rem] bg-muted/75 text-muted-foreground">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : (
            <span className="text-[11px] font-bold">#{rank}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {canOpenProfile ? (
            <button
              type="button"
              onClick={onOpenProfile}
              disabled={openingProfile}
              className="inline-flex max-w-full items-center gap-1.5 text-left text-sm font-bold text-foreground transition-colors hover:text-primary disabled:cursor-wait disabled:opacity-60"
            >
              <span className="truncate">{node.nomeAutorEmenda}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            </button>
          ) : (
            <p className="truncate text-sm font-bold text-foreground">
              {node.nomeAutorEmenda}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full bg-muted/75 px-2 py-0.5 font-medium text-muted-foreground">
              {formatCountCompact(node.totalEmendas ?? 0)} emendas
            </span>
            {canOpenProfile ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {openingProfile ? "Abrindo..." : "Perfil disponivel"}
              </span>
            ) : (
              <span className="rounded-full bg-muted/80 px-2 py-0.5 font-medium text-muted-foreground">
                Sem perfil
              </span>
            )}
          </div>
        </div>

        {/* Pago — destaque principal, direita */}
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Pago
          </p>
          <p className="mt-0.5 text-lg font-bold leading-none tracking-tight text-primary">
            {formatCentsCompact(node.totalPagoCents)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatCents(node.totalPagoCents)}
          </p>
        </div>
      </div>

      {/* Empenhado / Liquidado — secundários, discretos */}
      <div className="mt-3 flex flex-wrap gap-4 border-t border-border/60 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Empenhado
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground/70">
            {formatCentsCompact(node.totalEmpenhadoCents)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Liquidado
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground/70">
            {formatCentsCompact(node.totalLiquidadoCents)}
          </p>
        </div>
      </div>
    </article>
  );
};

const PoliticianSearchCard = ({ politico }: { politico: PoliticoResumo }) => (
  <article className="group rounded-[1.35rem] border border-border/75 bg-white/90 p-4 shadow-[0_18px_32px_-30px_rgba(15,23,42,0.28)] transition-all duration-150 hover:border-primary/18 hover:bg-primary/[0.03]">
    <div className="flex items-center gap-3">
      {politico.fotoUrl ? (
        <img
          src={politico.fotoUrl}
          alt={politico.nomeCanonico}
          className="h-11 w-11 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-muted/80">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
          {politico.nomeCompleto || politico.nomeCanonico}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          {politico.partido ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {politico.partido}
            </span>
          ) : null}
          {politico.uf ? (
            <span className="rounded-full bg-muted/80 px-2 py-0.5 font-semibold text-muted-foreground">
              {politico.uf}
            </span>
          ) : null}
          {politico.cargoAtual ? (
            <span className="rounded-full bg-muted/80 px-2 py-0.5 font-semibold text-muted-foreground">
              {politico.cargoAtual}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  </article>
);

const FeaturedPoliticoImage = ({
  nome,
  imageCandidates,
  className,
}: {
  nome: string;
  imageCandidates: string[];
  className: string;
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const safeIndex = Math.min(imageIndex, Math.max(imageCandidates.length - 1, 0));
  const imageUrl = imageCandidates[safeIndex] || buildAvatarUrl(nome);

  return (
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
      className={className}
    />
  );
};

const FeaturedPoliticoLeadCard = ({
  nome,
  imageCandidates,
  onClick,
}: {
  nome: string;
  imageCandidates: string[];
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group relative flex min-h-[172px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border/75 bg-white/92 px-5 py-5 text-left shadow-[0_24px_48px_-38px_rgba(15,23,42,0.35)] transition-all duration-150 hover:border-primary/18 hover:bg-primary/[0.025] sm:px-6 sm:py-6"
  >
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Crown className="h-3 w-3 text-primary" />
          Perfil mais acessado
        </p>
        <h3 className="mt-4 max-w-[18ch] text-xl font-bold leading-tight text-foreground">
          {nome}
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Abra o perfil completo para acompanhar viagens, emendas e o dossie consolidado.
        </p>
      </div>

      <FeaturedPoliticoImage
        nome={nome}
        imageCandidates={imageCandidates}
        className="h-20 w-20 flex-shrink-0 rounded-[1.25rem] border border-border/70 object-cover sm:h-24 sm:w-24"
      />
    </div>

    <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Top buscas</span> da home neste momento
      </p>
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/18 bg-primary/7 px-3 py-1 text-[11px] font-semibold text-primary">
        Abrir perfil
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </div>
  </button>
);

const FeaturedPoliticoCard = ({
  nome,
  imageCandidates,
  onClick,
}: {
  nome: string;
  imageCandidates: string[];
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex min-w-[220px] snap-start items-center gap-3 rounded-[1.15rem] border border-border/75 bg-white/88 px-3.5 py-3 text-left shadow-[0_14px_28px_-28px_rgba(15,23,42,0.3)] transition-all duration-150 hover:border-primary/18 hover:bg-primary/[0.025] sm:min-w-[240px] lg:min-w-0"
  >
    <FeaturedPoliticoImage
      nome={nome}
      imageCandidates={imageCandidates}
      className="h-12 w-12 flex-shrink-0 rounded-[0.9rem] border border-border/70 object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-bold text-foreground">{nome}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Abrir perfil</p>
    </div>
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.9rem] bg-muted/75 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
      <ArrowUpRight className="h-3.5 w-3.5" />
    </div>
  </button>
);

/* ─────────────────────────────────────────────────────── pure helpers ── */

function shortName(value?: string): string {
  if (!value) return "-";
  return value.split(" ").slice(0, 2).join(" ").slice(0, 18);
}

function compactTipoLabel(value?: string): string {
  if (!value) return "Nao informado";
  return value.replace(/\bEmenda\b/gi, "").replace(/\s+/g, " ").trim().slice(0, 34) || value;
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

  if (exactMatch) return exactMatch;
  if (nodes.length === 1) return nodes[0];
  return undefined;
}

function buildAvatarUrl(value: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    value
  )}&background=e6f7f7&color=0f766e&size=128&format=png`;
}

function buildPublicUrl(path: string): string {
  if (!path) {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function buildImageCandidates(...values: Array<string | undefined>) {
  return values.filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index
  );
}

export default Index;
