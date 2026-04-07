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
  normalizeConnection,
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
    helper: "Inclui políticos, bancadas, blocos, comissões e outros autores.",
  },
};

const featuredFallback = [
  {
    key: "lula",
    search: "lula",
    nomeCanonico: "lula",
    nome: "Luiz Inácio Lula da Silva",
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
    nome: "Flávio Dino",
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
        nome: item.tipoEmenda || "Não informado",
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
    "Consulte viagens oficiais, emendas parlamentares, rankings comparativos e perfis políticos em uma leitura clara orientada por dados públicos."
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
            { "@type": "Thing", name: "Transparência política" },
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
                name: "Perfis políticos em destaque",
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
          ).then((data) => normalizeConnection<PoliticoResumo>(data.politicos)),
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
          ).then((d) => normalizeConnection<PoliticoResumo>(d.politicos)),
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
        title="Radar do Povo | Transparência política em dados públicos"
        description={homeSeoDescription}
        path="/"
        keywords={[
          "radar do povo",
          "transparência política",
          "emendas parlamentares",
          "viagens oficiais",
          "perfis políticos",
          "gastos públicos",
        ]}
        structuredData={homeStructuredData}
      />
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:pt-10">

          {/* ── Hero Refinado ── */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={buildRevealVariants(Boolean(reduceMotion))}
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/30 px-7 py-10 shadow-xl backdrop-blur-xl ring-1 ring-black/5 sm:px-12 sm:py-14"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 left-[52%] w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
              <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              {/* Glows mais sofisticados */}
              <div className="animate-float-wide absolute -right-20 -top-10 h-72 w-72 rounded-full bg-primary/10 blur-[80px]" />
              <div className="animate-float-slow absolute right-32 top-20 h-48 w-48 rounded-full border border-primary/20 bg-gradient-to-tr from-primary/5 to-transparent shadow-lg" />
              <div className="animate-float-wide absolute -left-10 top-20 h-56 w-56 rounded-full bg-blue-500/5 blur-[60px]" style={{ animationDelay: '2s' }} />
              <div className="absolute left-[12%] top-12 h-20 w-20 rounded-full border border-white/60 bg-white/20 shadow-sm backdrop-blur-md" />
            </div>

            <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] xl:items-center">
              <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 14 })}>
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  Painel de transparência
                </p>
                <h1 className="text-[2.25rem] font-extrabold leading-[1.1] tracking-tighter text-foreground drop-shadow-sm sm:text-[3.25rem]">
                  Radar do Povo{" "}
                  <span className="relative inline-block">
                    <span className="absolute -inset-1 rounded-xl bg-primary/15 blur-xl"></span>
                    <span className="relative bg-gradient-to-br from-primary via-primary/90 to-blue-600 bg-clip-text text-transparent">orientado por dados</span>
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  Leitura institucional de emendas, viagens oficiais e perfis políticos, com menos ruído e mais critério na comparação dos dados públicos.
                </p>
              </motion.div>

              <motion.div
                variants={buildRevealVariants(Boolean(reduceMotion), { y: 14, delay: 0.03 })}
                className="grid gap-4 xl:justify-items-end"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={apiHealthQuery.data?.status}
                    loading={apiHealthQuery.isLoading}
                  />

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/60 bg-white/50 px-3.5 py-2 text-xs font-bold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    Ano
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setOffset(0);
                      }}
                      className="cursor-pointer bg-transparent text-xs outline-none"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[480px]">
                  <HeroSignalTile
                    icon={Banknote}
                    label="Emendas"
                    value={formatCentsCompact(resumo?.totalPagoCents)}
                    helper="Volume no recorte"
                  />
                  <HeroSignalTile
                    icon={Users}
                    label="Perfis"
                    value={formatCountCompact(resumo?.totalAutores)}
                    helper="Autores distintos"
                  />
                  <HeroSignalTile
                    icon={Globe}
                    label="Países"
                    value={formatCountCompact(resumo?.totalPaises)}
                    helper="Localidade atingida"
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

          {/* ── Search Bar Floating Card ── */}
          <EditorialSection tone="strong" className="mt-6 rounded-[2rem] border border-white/50 bg-white/30 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-md" delay={0.08}>
            <div className="relative rounded-[1.5rem] bg-white/80 p-2 shadow-sm sm:p-4">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching && searchQuery.isLoading}
                placeholder="Digite o nome de um político ou partido"
                submitLabel="Consultar"
                autoSearch
                debounceMs={300}
              />
            </div>
          </EditorialSection>

          {/* ── Featured shelf ── */}
          {!isSearching ? (
            <EditorialSection className="mt-6 overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 shadow-xl ring-1 ring-black/5 backdrop-blur-md" delay={0.11}>
              <div className="border-b border-white/40 bg-white/30 px-6 py-5 backdrop-blur-md sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-foreground">Top buscas</h2>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      Perfis mais acessados recentemente.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <button
                      onClick={() => navigate("/busca")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-primary hover:shadow-md"
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

              <div className="p-5 sm:p-6 sm:px-8">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
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
                    <div className="flex min-w-max snap-x snap-mandatory gap-4 pb-2 lg:min-w-0 lg:flex-col lg:pb-0">
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
              {searchQuery.isLoading ? <LoadingState message="Buscando políticos na API..." /> : null}
              {searchQuery.error ? <ErrorState error={searchQuery.error as Error} /> : null}
              {!searchQuery.isLoading && !searchQuery.error && searchQuery.data?.nodes.length === 0 ? (
                <EmptyState message="Nenhum político encontrado para este termo." />
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
              <EditorialSection className="mt-8 rounded-[2rem] border border-white/60 bg-white/40 shadow-xl ring-1 ring-black/5 backdrop-blur-md p-6 sm:p-8" delay={0.12}>
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-2xl">
                    <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" />
                      Leitura Anual
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tighter text-foreground sm:text-[2rem]">
                      {tabTitles[activeTab].title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {tabTitles[activeTab].helper} Destaque para autores, tipos de emenda e
                      localidade de aplicação no ano selecionado.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <HomeBriefCard
                      label="Ano em foco"
                      value={String(selectedYear)}
                      helper="Recorte atual"
                    />
                    <HomeBriefCard
                      label="Escopo"
                      value={tabs.find((tab) => tab.id === activeTab)?.label.replace("Top 30 ", "") || "-"}
                      helper={tabTitles[activeTab].helper.split(",")[0]}
                    />
                    <HomeBriefCard
                      label="Líder do ano"
                      value={shortName(leader?.nomeAutorEmenda)}
                      helper={
                        leader
                          ? `${formatCentsCompact(leader.totalPagoCents)} pagos`
                          : "Sem liderança consolidada"
                      }
                    />
                  </div>
                </div>

                <div className="mt-8 overflow-x-auto overscroll-x-contain pb-2">
                  <div className="flex min-w-max gap-3 px-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all duration-300 ${
                          tab.id === activeTab
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                            : "border-white/60 bg-white/50 text-muted-foreground backdrop-blur-md hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/80 hover:text-foreground hover:shadow-md"
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </EditorialSection>

              {/* ── Stats row ── */}
              <section className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
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
                    description={`${formatCountCompact(resumo?.totalTipos ?? 0)} tipos · ${formatCountCompact(resumo?.totalPaises ?? 0)} países`}
                    icon={ShieldCheck}
                    variant="blue"
                  />
                </div>
              </section>

              {/* ── Main content ── */}
              <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
                <div className="space-y-6">

                  {/* Leader card */}
                  {leader ? (
                    <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl">
                      {/* Glow effects */}
                      <div className="absolute -right-20 -top-20 h-72 w-72 pointer-events-none rounded-full bg-primary/10 blur-[60px]" />
                      <div className="absolute -left-20 -bottom-20 h-72 w-72 pointer-events-none rounded-full bg-amber-500/5 blur-[60px]" />
                      
                      <div className="relative border-b border-white/40 px-6 py-6 sm:px-8">
                        <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700 shadow-sm backdrop-blur-md">
                          <Crown className="h-3.5 w-3.5" />
                          Maior volume pago no ano
                        </p>

                        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            {canOpenPoliticoProfile(leader) ? (
                              <button
                                type="button"
                                onClick={() => void handleOpenPoliticoProfile(leader)}
                                className="inline-flex max-w-full items-center gap-2 text-left text-2xl font-extrabold tracking-tight text-foreground transition-colors hover:text-primary sm:text-3xl"
                              >
                                <span className="truncate drop-shadow-sm">{leader.nomeAutorEmenda}</span>
                                <ArrowUpRight className="h-5 w-5 shrink-0 text-primary" />
                              </button>
                            ) : (
                              <h3 className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-sm sm:text-3xl">
                                {leader.nomeAutorEmenda}
                              </h3>
                            )}
                            <p className="mt-2 text-sm font-medium text-muted-foreground">
                              {canOpenPoliticoProfile(leader)
                                ? "Perfil individual disponível para abrir o dossiê completo."
                                : "Autoria coletiva ou sem perfil individual público resolvido."}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Valor pago
                            </p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tighter text-primary drop-shadow-sm sm:text-4xl">
                              {formatCentsCompact(leader.totalPagoCents)}
                            </p>
                            <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                              {formatCents(leader.totalPagoCents)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative grid gap-0 sm:grid-cols-[1fr_1px_300px]">
                        <div className="p-6 sm:p-8">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                Emendas
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-foreground">
                                {formatCountCompact(leader.totalEmendas ?? 0)}
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                {(leader.totalEmendas ?? 0).toLocaleString("pt-BR")} registros
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                vs. Ticket
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-foreground">
                                {leaderToTicketRatio > 0
                                  ? `${leaderToTicketRatio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x`
                                  : "—"}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                Média: {formatCentsCompact(resumo?.ticketMedioPagoCents)}
                              </p>
                            </div>
                          </div>

                          {leaderRunnersUp.length ? (
                            <div className="mt-6 border-t border-white/40 pt-5">
                              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                Próximos no ranking
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {leaderRunnersUp.map((node, index) => (
                                  <div
                                    key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${index}`}
                                    className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3 text-xs shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all hover:bg-white/80"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-bold text-foreground">
                                        <span className="text-muted-foreground mr-1">#{index + 2}</span> {shortName(node.nomeAutorEmenda)}
                                      </p>
                                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                        {formatCountCompact(node.totalEmendas ?? 0)} emendas
                                      </p>
                                    </div>
                                    <p className="font-extrabold text-primary">
                                      {formatCentsCompact(node.totalPagoCents)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="hidden sm:block bg-white/40" />

                        <div className="border-t border-white/40 p-6 sm:border-t-0 sm:p-8">
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                            Leitura do recorte
                          </p>
                          <p className="mt-3 text-sm font-extrabold text-foreground">
                            {canOpenPoliticoProfile(leader)
                              ? "Perfil individual disponível"
                              : "Autoria coletiva ou não identificada"}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {leader.totalEmendas === 1
                              ? "Um único registro concentra esse destaque no ano."
                              : `Esse autor concentra ${formatCountCompact(leader.totalEmendas ?? 0)} emendas no recorte analisado.`}
                          </p>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {/* Ranking list */}
                  <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-extrabold text-foreground">Principais autores do ano</h2>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Clique no nome quando houver perfil individual identificado.
                        </p>
                      </div>
                      <div className="rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                        {formatCountCompact(total)} autores no ranking
                      </div>
                    </div>

                    <div className="space-y-3">
                      {activeQuery.isLoading ? <LoadingState message="Carregando ranking da API..." /> : null}
                      {activeQuery.error && rankingNodes.length === 0 ? <ErrorState error={activeQuery.error as Error} /> : null}
                      {!activeQuery.isLoading && !activeQuery.error && rankingNodes.length === 0 ? (
                        <EmptyState message="A API não retornou ranking para este ano." />
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
                      <div className="mt-6">
                        <PaginationControls
                          total={total}
                          limit={PAGE_SIZE}
                          offset={offset}
                          onPageChange={setOffset}
                          itemLabel="autores"
                        />
                      </div>
                    ) : null}
                  </section>
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-6">

                  {/* Tipo chart */}
                  <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 text-primary shadow-sm ring-1 ring-primary/20">
                        <PieChartIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-foreground">Composição por tipo</h2>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          Distribuição do valor pago.
                        </p>
                      </div>
                    </div>

                    {tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                    {tiposQuery.error && !typeChartData.length ? <ErrorState error={tiposQuery.error as Error} /> : null}
                    {!tiposQuery.isLoading && !tiposQuery.error && !typeChartData.length ? (
                      <EmptyState message="Sem tipos suficientes para montar a leitura." />
                    ) : null}

                    {typeChartData.length ? (
                      <div className="space-y-5">
                        <div className="relative mx-auto h-[200px] w-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={typeChartData}
                                dataKey="value"
                                nameKey="nome"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
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
                                contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center drop-shadow-sm">
                            <p className="text-3xl font-extrabold tracking-tight text-foreground">
                              {topTipo ? `${topTipo.share.toFixed(0)}%` : "—"}
                            </p>
                            <p className="mt-1 max-w-[100px] text-center text-[10px] font-bold uppercase leading-tight text-muted-foreground">
                              {compactTipoLabel(topTipo?.nome)}
                            </p>
                          </div>
                        </div>

                        {/* Bar summary */}
                        <div className="rounded-[1.25rem] border border-white/60 bg-white/50 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                          <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            <span>Distribuição do pago</span>
                            <span>100%</span>
                          </div>
                          <div className="flex h-2.5 overflow-hidden rounded-full shadow-inner">
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

                        <div className="space-y-2.5">
                          {typeChartData.map((item, index) => (
                            <div
                              key={item.nome}
                              className="group flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/80 hover:shadow-md"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                                  style={{ backgroundColor: item.color }}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-extrabold text-foreground transition-colors group-hover:text-primary">
                                    {compactTipoLabel(item.nome)}
                                  </p>
                                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                    {formatCountCompact(item.totalEmendas)} emendas
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-extrabold tracking-tight text-primary">
                                  {formatCentsCompact(String(Math.round(item.value * 100)))}
                                </p>
                                <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
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
                  <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 text-primary shadow-sm ring-1 ring-primary/20">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-foreground">Localidade</h2>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          Concentração geográfica.
                        </p>
                      </div>
                    </div>

                    {paisesQuery.isLoading ? <LoadingState message="Carregando recorte por país..." /> : null}
                    {paisesQuery.error && !(paisesQuery.data?.nodes?.length) ? <ErrorState error={paisesQuery.error as Error} /> : null}
                    {!paisesQuery.isLoading && !paisesQuery.error && !paisesQuery.data?.nodes.length ? (
                      <EmptyState message="Sem dados por país no ano selecionado." />
                    ) : null}

                    <div className="space-y-2.5">
                      {paisesQuery.data?.nodes.slice(0, 5).map((pais, index) => (
                        <div
                          key={`${pais.pais}-${index}`}
                          className="group flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/80 hover:shadow-md"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-extrabold text-foreground transition-colors group-hover:text-primary">
                              <span className="text-muted-foreground mr-1">{index + 1}.</span> {pais.pais}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                              {formatCountCompact(pais.totalEmendas ?? 0)} emendas
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-extrabold tracking-tight text-primary">
                              {formatCentsCompact(pais.totalPagoCents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {topPais ? (
                      <div className="mt-5 rounded-[1.25rem] border border-primary/30 bg-primary/10 px-5 py-4 text-[13px] shadow-sm backdrop-blur-md">
                        <span className="font-bold text-muted-foreground">Líder:</span>{" "}
                        <strong className="font-extrabold text-foreground">{topPais.pais}</strong>{" "}
                        <span className="text-primary mx-1">•</span>{" "}
                        <strong className="font-extrabold text-primary">{formatCentsCompact(topPais.totalPagoCents)}</strong>
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
      ? "API instável"
      : normalized === "offline"
      ? "API offline"
      : "API sem status";

  const tone =
    normalized === "ok"
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 shadow-emerald-500/10"
      : normalized === "degraded"
      ? "border-amber-200/80 bg-amber-50/90 text-amber-700 shadow-amber-500/10"
      : "border-red-200/80 bg-red-50/90 text-red-700 shadow-red-500/10";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11px] font-bold shadow-sm backdrop-blur-md ${tone}`}
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
  <div className="rounded-[1.25rem] border border-white/60 bg-white/40 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-md">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-base font-extrabold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] font-medium leading-5 text-muted-foreground">{helper}</p>
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
  <div className="group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/40 px-5 py-5 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/70 hover:shadow-xl">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />
    <div className="relative">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-md">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors group-hover:text-foreground">
          {label}
        </p>
      </div>
      <p className="mt-4 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">{helper}</p>
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
  const isTop3 = rank <= 3;

  return (
    <article className="group relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/50 px-5 py-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/80 hover:shadow-xl hover:shadow-primary/5">
      {isTop3 && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50" />}
      
      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1rem] shadow-sm ${isTop3 ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-1 ring-amber-200/50' : 'bg-white/80 text-muted-foreground ring-1 ring-black/5'}`}>
            {Icon ? <Icon className="h-5 w-5" /> : (
              <span className="text-[13px] font-bold">#{rank}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {canOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                disabled={openingProfile}
                className="inline-flex max-w-full items-center gap-1.5 text-left text-sm font-extrabold text-foreground transition-colors hover:text-primary disabled:cursor-wait disabled:opacity-60"
              >
                <span className="truncate">{node.nomeAutorEmenda}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
              </button>
            ) : (
              <p className="truncate text-sm font-extrabold text-foreground">
                {node.nomeAutorEmenda}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-muted-foreground shadow-sm ring-1 ring-black/5">
                {formatCountCompact(node.totalEmendas ?? 0)} emendas
              </span>
              {canOpenProfile ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary shadow-sm">
                  {openingProfile ? "Abrindo..." : "Perfil disponível"}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-500 shadow-sm ring-1 ring-black/5">
                  Sem perfil
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pago — destaque principal, direita */}
        <div className="shrink-0 sm:text-right pt-2 sm:pt-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Pago
          </p>
          <p className="mt-1 text-lg font-extrabold leading-none tracking-tight text-primary drop-shadow-sm">
            {formatCentsCompact(node.totalPagoCents)}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            {formatCents(node.totalPagoCents)}
          </p>
        </div>
      </div>
    </article>
  );
};

const PoliticianSearchCard = ({ politico }: { politico: PoliticoResumo }) => (
  <article className="group flex items-center gap-4 rounded-[1.5rem] border border-white/60 bg-white/50 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/80 hover:shadow-xl">
    {politico.fotoUrl ? (
      <img
        src={politico.fotoUrl}
        alt={politico.nomeCanonico}
        className="h-14 w-14 rounded-[1.25rem] object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
      />
    ) : (
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/80 shadow-sm ring-1 ring-black/5 transition-colors group-hover:bg-primary/5">
        <Users className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    )}

    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-extrabold text-foreground transition-colors group-hover:text-primary">
        {politico.nomeCompleto || politico.nomeCanonico}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
        {politico.partido ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary shadow-sm">
            {politico.partido}
          </span>
        ) : null}
        {politico.uf ? (
          <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">
            {politico.uf}
          </span>
        ) : null}
        {politico.cargoAtual ? (
          <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">
            {politico.cargoAtual}
          </span>
        ) : null}
      </div>
    </div>
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-muted-foreground shadow-sm transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:bg-primary group-hover:text-white sm:mr-2">
      <ArrowUpRight className="h-4 w-4" />
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
    className="group relative flex min-h-[172px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/60 px-5 py-6 text-left shadow-xl ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/90 hover:shadow-2xl sm:px-7 sm:py-7"
  >
    <div className="relative flex items-start justify-between gap-5">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
          <Crown className="h-3.5 w-3.5" />
          Perfil mais acessado
        </p>
        <h3 className="mt-5 max-w-[18ch] text-2xl font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">
          {nome}
        </h3>
        <p className="mt-2.5 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
          Abra o perfil completo para acompanhar viagens, emendas e o dossiê consolidado.
        </p>
      </div>

      <FeaturedPoliticoImage
        nome={nome}
        imageCandidates={imageCandidates}
        className="h-24 w-24 flex-shrink-0 rounded-[1.25rem] border border-white/80 object-cover shadow-md transition-transform duration-500 group-hover:scale-105 group-hover:shadow-xl sm:h-28 sm:w-28"
      />
    </div>

    <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-white/50 pt-5">
      <p className="text-xs font-medium text-muted-foreground">
        <span className="font-extrabold text-foreground">Top buscas</span> na home
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
        Abrir perfil
        <ArrowUpRight className="h-3.5 w-3.5" />
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
    className="group flex min-w-[220px] snap-start items-center gap-4 rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 text-left shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/80 hover:shadow-xl sm:min-w-[240px] lg:min-w-0"
  >
    <FeaturedPoliticoImage
      nome={nome}
      imageCandidates={imageCandidates}
      className="h-14 w-14 flex-shrink-0 rounded-[1rem] border border-white/80 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-extrabold text-foreground transition-colors group-hover:text-primary">{nome}</p>
      <p className="mt-0.5 text-[11px] font-bold text-muted-foreground transition-colors group-hover:text-primary/70">Abrir perfil</p>
    </div>
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-muted-foreground shadow-sm transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-md">
      <ArrowUpRight className="h-4 w-4" />
    </div>
  </button>
);

/* ─────────────────────────────────────────────────────── pure helpers ── */

function shortName(value?: string): string {
  if (!value) return "-";
  return value.split(" ").slice(0, 2).join(" ").slice(0, 18);
}

function compactTipoLabel(value?: string): string {
  if (!value) return "Não informado";
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
