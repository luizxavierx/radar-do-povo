import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Crown,
  FileText,
  Globe,
  Landmark,
  Medal,
  MoveRight,
  PieChart as PieChartIcon,
  RefreshCcw,
  Trophy,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import AppSidebar from "@/components/AppSidebar";
import EditorialPageHeader from "@/components/EditorialPageHeader";
import EditorialSection from "@/components/EditorialSection";
import MobileFiltersPanel from "@/components/MobileFiltersPanel";
import PaginationControls from "@/components/PaginationControls";
import SeoHead from "@/components/SeoHead";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  useEmendaRankingResumo,
  useEmendaSerieAnual,
  useTopEmendasPorPaisCustom,
  useTopGastadoresCustom,
  useTopTiposCustom,
} from "@/hooks/useRankings";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
} from "@/lib/formatters";
import { buildBreadcrumbStructuredData } from "@/lib/seo";
import { buildHoverLift, buildRevealVariants, buildStaggerVariants } from "@/lib/motion";
import type {
  EmendaSerieAnualNode,
  RankingEmendaFiltroInput,
  TopGastadorEmenda,
} from "@/api/types";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_END_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const DEFAULT_START_YEAR = Math.max(2019, DEFAULT_END_YEAR - 5);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const typeChartColors = ["#0f766e", "#2563eb", "#f59e0b", "#14b8a6", "#7c3aed", "#ef4444"];
const countryChartColors = ["#1d4ed8", "#0284c7", "#0f766e", "#7c3aed", "#f97316", "#dc2626"];
const rankIcons = [Crown, Trophy, Medal];
const ufOptions = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;

type ScopeId = "parlamentares" | "deputados" | "senadores" | "geral" | "bancadas";

const scopeTabs: { id: ScopeId; label: string; icon: typeof Users; helper: string }[] = [
  { id: "parlamentares", label: "Parlamentares", icon: BarChart3, helper: "Recorte parlamentar sem bancadas" },
  { id: "deputados",     label: "Deputados",     icon: Users,     helper: "Autores com cargo atual de deputado" },
  { id: "senadores",     label: "Senadores",     icon: Landmark,  helper: "Autores com cargo atual de senador" },
  { id: "geral",         label: "Geral",         icon: Globe,     helper: "Inclui parlamentares, bancadas e outros autores" },
  { id: "bancadas",      label: "Bancadas",      icon: Users,     helper: "Somente bancadas, blocos, comissoes e partidos" },
];

const RankingsPage = () => {
  const [scope, setScope] = useState<ScopeId>("parlamentares");
  const [anoInicio, setAnoInicio] = useState(DEFAULT_START_YEAR);
  const [anoFim, setAnoFim] = useState(DEFAULT_END_YEAR);
  const [uf, setUf] = useState("");
  const [tipoEmenda, setTipoEmenda] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [serieReady, setSerieReady] = useState(false);
  const [tiposReady, setTiposReady] = useState(false);
  const [paisesReady, setPaisesReady] = useState(false);

  const filtro = useMemo<RankingEmendaFiltroInput>(() => {
    const base: RankingEmendaFiltroInput = {
      anoInicio,
      anoFim,
      uf: uf || undefined,
      tipoEmenda: tipoEmenda.trim() || undefined,
    };

    if (scope === "parlamentares") return { ...base, apenasParlamentares: true };
    if (scope === "deputados")     return { ...base, apenasParlamentares: true, cargoParlamentar: "DEPUTADO" };
    if (scope === "senadores")     return { ...base, apenasParlamentares: true, cargoParlamentar: "SENADOR" };
    if (scope === "bancadas")      return { ...base, apenasBancadas: true };
    return { ...base, apenasParlamentares: false };
  }, [anoFim, anoInicio, scope, tipoEmenda, uf]);

  const resumoQuery   = useEmendaRankingResumo(filtro);
  const rankingQuery  = useTopGastadoresCustom(filtro, { limit, offset });
  const serieQuery    = useEmendaSerieAnual(filtro, { enabled: serieReady });
  const tiposQuery    = useTopTiposCustom(filtro, { limit: 6, offset: 0 }, { enabled: tiposReady });
  const paisesQuery   = useTopEmendasPorPaisCustom(
    filtro,
    { limit: 6, offset: 0 },
    { enabled: paisesReady }
  );

  useEffect(() => {
    setSerieReady(false);
    setTiposReady(false);
    setPaisesReady(false);
  }, [anoInicio, anoFim, scope, tipoEmenda, uf]);

  const coreWaveSettled = !resumoQuery.isFetching && !rankingQuery.isFetching;
  const seriesWaveSettled = serieReady && !serieQuery.isFetching;
  const typesWaveSettled = tiposReady && !tiposQuery.isFetching;

  useEffect(() => {
    if (coreWaveSettled && !serieReady) {
      setSerieReady(true);
    }
  }, [coreWaveSettled, serieReady]);

  useEffect(() => {
    if (seriesWaveSettled && !tiposReady) {
      setTiposReady(true);
    }
  }, [seriesWaveSettled, tiposReady]);

  useEffect(() => {
    if (typesWaveSettled && !paisesReady) {
      setPaisesReady(true);
    }
  }, [paisesReady, typesWaveSettled]);

  const resumo       = resumoQuery.data;
  const rankingNodes = rankingQuery.data?.nodes ?? [];
  const totalRanking = rankingQuery.data?.total ?? 0;
  const seriesNodes  = serieQuery.data?.nodes ?? [];
  const tiposNodes   = (tiposQuery.data?.nodes ?? []).slice(0, 6);
  const paisNodes    = (paisesQuery.data?.nodes ?? []).slice(0, 6);
  const singleYearNode = seriesNodes.length === 1 ? seriesNodes[0] : null;
  const totalPagoNumber = centsToNumber(resumo?.totalPagoCents ?? "0");

  const serieChartData = useMemo(
    () =>
      seriesNodes.map((item: EmendaSerieAnualNode) => ({
        ano:       String(item.ano),
        pago:      centsToNumber(item.totalPagoCents),
        empenhado: centsToNumber(item.totalEmpenhadoCents),
        emendas:   item.totalEmendas ?? 0,
      })),
    [seriesNodes]
  );

  const tipoChartData = useMemo(
    () =>
      tiposNodes.map((item, index) => {
        const value = centsToNumber(item.totalPagoCents);
        return {
          rank: index + 1,
          nome: item.tipoEmenda || "Não informado",
          value,
          totalEmendas: item.totalEmendas ?? 0,
          totalPagoCents: item.totalPagoCents,
          color: typeChartColors[index % typeChartColors.length],
          share: totalPagoNumber > 0 ? (value / totalPagoNumber) * 100 : 0,
        };
      }),
    [tiposNodes, totalPagoNumber]
  );

  const tipoCoverage = useMemo(
    () => tipoChartData.reduce((acc, item) => acc + item.share, 0),
    [tipoChartData]
  );

  const topTipo = tipoChartData[0] ?? null;

  const paisChartData = useMemo(
    () =>
      paisNodes.map((item, index) => {
        const value = centsToNumber(item.totalPagoCents);
        return {
          rank: index + 1,
          nome: item.pais || "Não informado",
          totalEmendas: item.totalEmendas ?? 0,
          totalPagoCents: item.totalPagoCents,
          share: totalPagoNumber > 0 ? (value / totalPagoNumber) * 100 : 0,
          color: countryChartColors[index % countryChartColors.length],
        };
      }),
    [paisNodes, totalPagoNumber]
  );

  const hasSerieData = serieChartData.length > 0;
  const hasTipoData = tipoChartData.length > 0;
  const hasPaisData = paisChartData.length > 0;
  const hasRankingData = rankingNodes.length > 0;

  const paisCoverage = useMemo(
    () => paisChartData.reduce((acc, item) => acc + item.share, 0),
    [paisChartData]
  );

  const topPais = paisChartData[0] ?? null;

  const annualHighlights = useMemo(() => {
    if (!seriesNodes.length) {
      return {
        strongestPaid:      null as EmendaSerieAnualNode | null,
        strongestEmpenhado: null as EmendaSerieAnualNode | null,
        latestYear:         null as EmendaSerieAnualNode | null,
      };
    }
    return {
      strongestPaid:      [...seriesNodes].sort((a, b) => centsToNumber(b.totalPagoCents)      - centsToNumber(a.totalPagoCents))[0],
      strongestEmpenhado: [...seriesNodes].sort((a, b) => centsToNumber(b.totalEmpenhadoCents) - centsToNumber(a.totalEmpenhadoCents))[0],
      latestYear:         [...seriesNodes].sort((a, b) => b.ano - a.ano)[0],
    };
  }, [seriesNodes]);

  const clearFilters = () => {
    setScope("parlamentares");
    setAnoInicio(DEFAULT_START_YEAR);
    setAnoFim(DEFAULT_END_YEAR);
    setUf("");
    setTipoEmenda("");
    setOffset(0);
    setLimit(10);
  };

  const activeScopeMeta      = scopeTabs.find((tab) => tab.id === scope) ?? scopeTabs[0];
  const totalPagoCents       = resumo?.totalPagoCents       ?? "0";
  const totalEmpenhadoCents  = resumo?.totalEmpenhadoCents  ?? "0";
  const ticketMedioPagoCents = resumo?.ticketMedioPagoCents ?? "0";
  const activeFilterCount =
    Number(scope !== "parlamentares") +
    Number(Boolean(uf)) +
    Number(Boolean(tipoEmenda.trim())) +
    Number(anoInicio !== DEFAULT_START_YEAR || anoFim !== DEFAULT_END_YEAR);
  const mobileFilterSummary = [
    `Escopo ${activeScopeMeta.label}`,
    `Período ${anoInicio}-${anoFim}`,
    uf ? `UF ${uf}` : null,
    tipoEmenda.trim() ? `Tipo ${tipoEmenda.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const seoDescription =
    "Compare rankings de emendas parlamentares, evolução anual, composição por tipo e distribuição geográfica em uma leitura orientada por recorte.";
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <SeoHead
        title="Rankings de emendas parlamentares | Radar do Povo"
        description={seoDescription}
        path="/rankings"
        keywords={[
          "rankings de emendas",
          "emendas parlamentares",
          "comparativo de emendas",
          "ranking de gastos públicos",
          "radar do povo rankings",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Rankings de emendas parlamentares",
            description: seoDescription,
            url: "https://radardopovo.com/rankings",
            inLanguage: "pt-BR",
            isPartOf: {
              "@type": "WebSite",
              name: "Radar do Povo",
              url: "https://radardopovo.com",
            },
            about: [
              { "@type": "Thing", name: "Emendas parlamentares" },
              { "@type": "Thing", name: "Rankings comparativos" },
              { "@type": "Thing", name: "Série anual de gastos" },
            ],
          },
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Rankings", path: "/rankings" },
          ]),
        ]}
      />
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:pt-10">

          {/* ── Hero ── */}
          <EditorialPageHeader
            eyebrow="Panorama de emendas"
            icon={FileText}
            reveal="mount"
            title={
              <>
                Emendas por <span className="text-gradient-primary">ano, autor e tipo</span>
              </>
            }
            description="Painel comparativo para enxergar volume financeiro, distribuição anual, concentração por autoria e composição do gasto com uma leitura mais limpa."
            aside={
              <div className="hidden gap-3 sm:grid sm:grid-cols-3 xl:grid-cols-1">
                <HeroSummaryCard
                  label="Escopo"
                  value={activeScopeMeta.label}
                  helper={activeScopeMeta.helper}
                />
                <HeroSummaryCard
                  label="Período"
                  value={`${anoInicio} - ${anoFim}`}
                  helper="Recorte anual aplicado"
                />
                <HeroSummaryCard
                  label="UF / tipo"
                  value={uf || "Todas"}
                  helper={tipoEmenda.trim() || "Todos os tipos"}
                />
              </div>
            }
            meta={
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur-md">{formatCountCompact(totalRanking)} autores</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                  {formatCountCompact(resumo?.totalEmendas ?? 0)} emendas consolidadas
                </span>
              </>
            }
          />

          {/* ── Filters + scope tabs ── */}
          <EditorialSection tone="muted" className="mt-6 rounded-[2rem] border border-white/50 bg-white/30 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-md" reveal="mount">
            <div className="flex flex-col gap-5 rounded-[1.5rem] bg-white/80 p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-foreground">Controles do recorte</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Escolha o escopo, o período e refinamentos antes de comparar os dados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-primary hover:shadow-md"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              </div>

              <MobileFiltersPanel
                title="Filtros do ranking"
                subtitle="Escopo, período, UF e tipo de emenda"
                summary={mobileFilterSummary}
                activeCount={activeFilterCount}
              >
                <div className="flex flex-col gap-5">
                  <div className="overflow-x-auto overscroll-x-contain pb-2">
                    <div className="flex min-w-max gap-3 px-1">
                      {scopeTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => { setScope(tab.id); setOffset(0); }}
                          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all duration-300 ${
                            scope === tab.id
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <FilterField label="Ano inicial">
                      <select
                        value={anoInicio}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          setAnoInicio(next);
                          if (next > anoFim) setAnoFim(next);
                          setOffset(0);
                        }}
                        className="h-11 w-full rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium shadow-sm outline-none ring-1 ring-black/5 backdrop-blur-md transition-all focus:border-primary/40 focus:bg-white/80 focus:ring-primary/20"
                      >
                        {years.map((year) => <option key={`start-${year}`} value={year}>{year}</option>)}
                      </select>
                    </FilterField>

                    <FilterField label="Ano final">
                      <select
                        value={anoFim}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          setAnoFim(next);
                          if (next < anoInicio) setAnoInicio(next);
                          setOffset(0);
                        }}
                        className="h-11 w-full rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium shadow-sm outline-none ring-1 ring-black/5 backdrop-blur-md transition-all focus:border-primary/40 focus:bg-white/80 focus:ring-primary/20"
                      >
                        {years.map((year) => <option key={`end-${year}`} value={year}>{year}</option>)}
                      </select>
                    </FilterField>

                    <FilterField label="UF">
                      <select
                        value={uf}
                        onChange={(e) => { setUf(e.target.value); setOffset(0); }}
                        className="h-11 w-full rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium shadow-sm outline-none ring-1 ring-black/5 backdrop-blur-md transition-all focus:border-primary/40 focus:bg-white/80 focus:ring-primary/20"
                      >
                        <option value="">Todas</option>
                        {ufOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </FilterField>

                    <FilterField label="Tipo de emenda">
                      <input
                        value={tipoEmenda}
                        onChange={(e) => { setTipoEmenda(e.target.value); setOffset(0); }}
                        placeholder="Ex.: Individual"
                        className="h-11 w-full rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium shadow-sm outline-none ring-1 ring-black/5 backdrop-blur-md placeholder:text-muted-foreground/70 transition-all focus:border-primary/40 focus:bg-white/80 focus:ring-primary/20"
                      />
                    </FilterField>

                    <FilterField label="Resultados">
                      <div className="flex h-11 items-center rounded-2xl border border-white/60 bg-white/40 px-4 text-sm font-bold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                        {formatCountCompact(totalRanking)} autores
                      </div>
                    </FilterField>
                  </div>
                </div>
              </MobileFiltersPanel>
            </div>
          </EditorialSection>

          {/* ── KPIs ── */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={buildStaggerVariants(Boolean(reduceMotion))}
            className="mt-6"
          >
            {resumoQuery.isLoading && !resumo ? <LoadingState message="Carregando resumo de emendas..." /> : null}
            {resumoQuery.error && !resumo ? <ErrorState error={resumoQuery.error as Error} /> : null}

            {resumo ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 12 })}>
                  <StatsCard
                  label="Total pago"
                  value={formatCentsCompact(totalPagoCents)}
                  helper={formatCents(totalPagoCents)}
                  description={`Escopo ${activeScopeMeta.label.toLowerCase()}`}
                  icon={Landmark}
                  variant="green"
                  />
                </motion.div>
                <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 12, delay: 0.02 })}>
                  <StatsCard
                  label="Total emendas"
                  value={formatCountCompact(resumo.totalEmendas ?? 0)}
                  helper={(resumo.totalEmendas ?? 0).toLocaleString("pt-BR")}
                  description="Registros consolidados no recorte"
                  icon={FileText}
                  variant="blue"
                  />
                </motion.div>
                <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 12, delay: 0.04 })}>
                  <StatsCard
                  label="Autores distintos"
                  value={formatCountCompact(resumo.totalAutores ?? 0)}
                  helper={(resumo.totalAutores ?? 0).toLocaleString("pt-BR")}
                  description="Autores ou grupos identificados"
                  icon={Users}
                  variant="yellow"
                  />
                </motion.div>
                <motion.div variants={buildRevealVariants(Boolean(reduceMotion), { y: 12, delay: 0.06 })}>
                  <StatsCard
                  label="Ticket médio pago"
                  value={formatCentsCompact(ticketMedioPagoCents)}
                  helper={formatCents(ticketMedioPagoCents)}
                  description={`${formatCountCompact(resumo.totalTipos ?? 0)} tipos e ${formatCountCompact(resumo.totalPaises ?? 0)} países`}
                  icon={PieChartIcon}
                  variant="blue"
                  />
                </motion.div>
              </div>
            ) : null}
          </motion.section>

          {/* ── Charts row ── */}
          <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">

            {/* Annual evolution */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">Evolução anual</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Pago e empenhado por ano para comparar ritmo de execução.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                  {anoInicio} – {anoFim}
                </div>
              </div>

              {!serieReady || serieQuery.isLoading ? <LoadingState message="Carregando série anual..." /> : null}
              {serieQuery.error && !hasSerieData ? <ErrorState error={serieQuery.error as Error} /> : null}
              {serieReady && !serieQuery.isLoading && !serieQuery.error && !hasSerieData ? (
                <EmptyState message="Nenhuma série anual encontrada para este recorte." />
              ) : null}

              {singleYearNode ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InsightPill label="Ano observado" value={String(singleYearNode.ano)}                                       helper="Recorte com um único ano" />
                    <InsightPill label="Pago"           value={formatCentsCompact(singleYearNode.totalPagoCents)}               helper={formatCents(singleYearNode.totalPagoCents)} />
                    <InsightPill label="Empenhado"      value={formatCentsCompact(singleYearNode.totalEmpenhadoCents)}          helper={formatCents(singleYearNode.totalEmpenhadoCents)} />
                    <InsightPill label="Emendas"        value={formatCountCompact(singleYearNode.totalEmendas ?? 0)}            helper={`${(singleYearNode.totalAutores ?? 0).toLocaleString("pt-BR")} autores`} />
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                        Pago
                      </span>
                      <MoveRight className="h-3 w-3" />
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
                        Empenhado
                      </span>
                    </div>

                    <div className="space-y-4">
                      <AnnualBar
                        label="Pago"
                        value={formatCentsCompact(singleYearNode.totalPagoCents)}
                        helper={formatCents(singleYearNode.totalPagoCents)}
                        ratio={1}
                        tone="primary"
                      />
                      <AnnualBar
                        label="Empenhado"
                        value={formatCentsCompact(singleYearNode.totalEmpenhadoCents)}
                        helper={formatCents(singleYearNode.totalEmpenhadoCents)}
                        ratio={Math.min(1, Math.max(0.18,
                          centsToNumber(singleYearNode.totalEmpenhadoCents) > 0
                            ? centsToNumber(singleYearNode.totalPagoCents) / centsToNumber(singleYearNode.totalEmpenhadoCents)
                            : 0
                        ))}
                        tone="secondary"
                      />
                    </div>
                  </div>
                </div>
              ) : serieChartData.length ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InsightPill
                      label="Maior pago"
                      value={annualHighlights.strongestPaid ? `${annualHighlights.strongestPaid.ano}` : "-"}
                      helper={annualHighlights.strongestPaid ? formatCentsCompact(annualHighlights.strongestPaid.totalPagoCents) : "Sem dado"}
                    />
                    <InsightPill
                      label="Maior empenhado"
                      value={annualHighlights.strongestEmpenhado ? `${annualHighlights.strongestEmpenhado.ano}` : "-"}
                      helper={annualHighlights.strongestEmpenhado ? formatCentsCompact(annualHighlights.strongestEmpenhado.totalEmpenhadoCents) : "Sem dado"}
                    />
                    <InsightPill
                      label="Último ano"
                      value={annualHighlights.latestYear ? `${annualHighlights.latestYear.ano}` : "-"}
                      helper={annualHighlights.latestYear ? `${formatCountCompact(annualHighlights.latestYear.totalEmendas ?? 0)} emendas` : "Sem dado"}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                        Pago
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
                        Empenhado
                      </span>
                    </div>

                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={serieChartData} margin={{ top: 8, left: 0, right: 0, bottom: 4 }}>
                          <defs>
                            <linearGradient id="emendasPagoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="hsl(182 89% 30%)" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="hsl(182 89% 30%)" stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="emendasEmpenhadoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="hsl(212 93% 47%)" stopOpacity={0.55} />
                              <stop offset="100%" stopColor="hsl(212 93% 47%)" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                          <XAxis dataKey="ano"  tickLine={false} axisLine={false} fontSize={11} fontWeight={600} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            fontWeight={600}
                            width={74}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => `R$ ${(value / 1_000_000).toFixed(0)} mi`}
                          />
                          <RechartsTooltip
                            formatter={(value: number) =>
                              value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                            }
                            contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="empenhado" stroke="hsl(212 93% 47%)" fill="url(#emendasEmpenhadoGradient)" strokeWidth={2.5} name="Empenhado" />
                          <Area type="monotone" dataKey="pago"      stroke="hsl(182 89% 30%)" fill="url(#emendasPagoGradient)"      strokeWidth={3} name="Pago" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Tipo chart */}
              <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 text-primary shadow-sm ring-1 ring-primary/20">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">Composição por tipo</h2>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      Distribuição do valor pago.
                    </p>
                  </div>
                </div>

                {!tiposReady || tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                {tiposQuery.error && !hasTipoData ? <ErrorState error={tiposQuery.error as Error} /> : null}
                {tiposReady && !tiposQuery.isLoading && !tiposQuery.error && !hasTipoData ? (
                  <EmptyState message="Sem tipos suficientes para montar o gráfico." />
                ) : null}

                {tipoChartData.length ? (
                  <div className="grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={tipoChartData}
                              dataKey="value"
                              nameKey="nome"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={95}
                              paddingAngle={3}
                              stroke="transparent"
                            >
                              {tipoChartData.map((item) => (
                                <Cell key={item.nome} fill={item.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) =>
                                value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                              }
                              contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="w-full max-w-[136px] rounded-full border border-white/80 bg-white/80 px-3 py-3 text-center shadow-md backdrop-blur-md">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Top 6</p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{tipoCoverage.toFixed(0)}%</p>
                            <p className="text-[11px] font-medium text-muted-foreground">do pago</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                        <BreakdownStatCard
                          label="Tipo líder"
                          value={topTipo?.nome ?? "-"}
                          helper={topTipo ? formatCentsCompact(topTipo.totalPagoCents) : "Sem dado"}
                        />
                        <BreakdownStatCard
                          label="Maior fatia"
                          value={topTipo ? `${topTipo.share.toFixed(1)}%` : "-"}
                          helper={topTipo ? `${formatCountCompact(topTipo.totalEmendas)} emendas` : "Sem dado"}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-3">
                      {tipoChartData.map((item) => (
                        <BreakdownListItem
                          key={item.nome}
                          accentColor={item.color}
                          eyebrow={`#${item.rank}`}
                          title={item.nome}
                          subtitle={`${formatCountCompact(item.totalEmendas)} emendas`}
                          value={formatCentsCompact(item.totalPagoCents)}
                          share={item.share}
                          shareLabel={`${item.share.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Países */}
              <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 text-primary shadow-sm ring-1 ring-primary/20">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">Localidade</h2>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      Concentração geográfica.
                    </p>
                  </div>
                </div>

                {!paisesReady || paisesQuery.isLoading ? <LoadingState message="Carregando países..." /> : null}
                {paisesQuery.error && !hasPaisData ? <ErrorState error={paisesQuery.error as Error} /> : null}
                {paisesReady && !paisesQuery.isLoading && !paisesQuery.error && !hasPaisData ? (
                  <EmptyState message="Nenhum país encontrado para este recorte." />
                ) : null}

                {paisChartData.length ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <BreakdownStatCard
                        label="Líder geográfico"
                        value={topPais?.nome ?? "-"}
                        helper={topPais ? formatCentsCompact(topPais.totalPagoCents) : "Sem dado"}
                      />
                      <BreakdownStatCard
                        label="Cobertura top 6"
                        value={`${paisCoverage.toFixed(1)}%`}
                        helper="Participação sobre o valor pago"
                      />
                    </div>

                    <div className="space-y-3">
                      {paisChartData.map((item) => (
                        <BreakdownListItem
                          key={`${item.nome}-${item.rank}`}
                          accentColor={item.color}
                          eyebrow={`#${item.rank}`}
                          title={item.nome}
                          subtitle={`${formatCountCompact(item.totalEmendas)} emendas`}
                          value={formatCentsCompact(item.totalPagoCents)}
                          share={item.share}
                          shareLabel={`${item.share.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          {/* ── Ranking table ── */}
          <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">Principais autores do recorte</h2>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Ranking detalhado com valor pago, empenhado e volume de emendas.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                {formatCentsCompact(totalEmpenhadoCents)} empenhados
              </div>
            </div>

            {rankingQuery.isLoading ? <LoadingState message="Carregando ranking de autores..." /> : null}
            {rankingQuery.error && !hasRankingData ? <ErrorState error={rankingQuery.error as Error} /> : null}
            {!rankingQuery.isLoading && !rankingQuery.error && !hasRankingData ? (
              <EmptyState message="Nenhum autor encontrado com esse filtro." />
            ) : null}

            <div className="space-y-3">
              {rankingNodes.map((node, index) => (
                <RankingAuthorRow
                  key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${offset + index}`}
                  node={node}
                  rank={offset + index + 1}
                />
              ))}
            </div>

            {totalRanking > 0 ? (
              <div className="mt-6">
                <PaginationControls
                  total={totalRanking}
                  limit={limit}
                  offset={offset}
                  onPageChange={setOffset}
                  pageSizeOptions={[10, 20, 30]}
                  onPageSizeChange={(pageSize) => { setLimit(pageSize); setOffset(0); }}
                />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────────── sub-components ── */

const HeroSummaryCard = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="rounded-[1.25rem] border border-white/60 bg-white/40 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-md">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-base font-extrabold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] font-medium leading-5 text-muted-foreground">{helper}</p>
  </div>
);

const InsightPill = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
    <p className="mt-1.5 text-lg font-extrabold tracking-tight text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{helper}</p>
  </div>
);

const BreakdownStatCard = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
    <p className="mt-1.5 line-clamp-2 text-sm font-extrabold leading-tight text-foreground sm:text-base">{value}</p>
    <p className="mt-1 text-[11px] font-medium text-muted-foreground">{helper}</p>
  </div>
);

const BreakdownListItem = ({
  accentColor,
  eyebrow,
  title,
  subtitle,
  value,
  share,
  shareLabel,
}: {
  accentColor: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  value: string;
  share: number;
  shareLabel: string;
}) => {
  const width = share > 0 ? `${Math.min(100, Math.max(8, share))}%` : "0%";

  return (
    <article className="group min-w-0 overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/80 hover:shadow-md">
      <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border text-[12px] font-extrabold shadow-sm transition-transform duration-300 group-hover:scale-105"
            style={{
              color: accentColor,
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}10`,
            }}
          >
            {eyebrow}
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="break-words text-[13px] font-extrabold text-foreground transition-colors group-hover:text-primary">{title}</p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="min-w-0 flex items-end justify-between gap-3 min-[520px]:block min-[520px]:text-right">
          <p className="break-words text-sm font-extrabold tracking-tight text-foreground group-hover:text-primary">{value}</p>
          <p className="mt-0.5 break-words text-[11px] font-bold text-muted-foreground">{shareLabel}</p>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-black/5">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width, backgroundColor: accentColor }} />
      </div>
    </article>
  );
};

const AnnualBar = ({
  label, value, helper, ratio, tone,
}: {
  label: string; value: string; helper: string; ratio: number; tone: "primary" | "secondary";
}) => {
  const width = `${Math.min(100, Math.max(12, ratio * 100))}%`;

  return (
    <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:bg-white/80 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className={`mt-1.5 text-lg font-extrabold tracking-tight ${tone === "primary" ? "text-primary drop-shadow-sm" : "text-blue-600 drop-shadow-sm"}`}>{value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{helper}</p>
        </div>
      </div>
      <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-black/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${tone === "primary" ? "bg-gradient-to-r from-primary/80 to-primary" : "bg-gradient-to-r from-blue-500/80 to-blue-500"}`}
          style={{ width }}
        />
      </div>
    </div>
  );
};

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="space-y-2">
    <span className="block pl-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

const RankingAuthorRow = ({ node, rank }: { node: TopGastadorEmenda; rank: number }) => {
  const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;
  const isTop3 = rank <= 3;

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/50 px-5 py-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/80 hover:shadow-xl hover:shadow-primary/5">
      {isTop3 && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50" />}
      
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Rank + name */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] shadow-sm ${isTop3 ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-1 ring-amber-200/50' : 'bg-white/80 text-muted-foreground ring-1 ring-black/5'}`}>
            {RankIcon
              ? <RankIcon className="h-5 w-5" />
              : <span className="text-[13px] font-bold">#{rank}</span>
            }
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-foreground transition-colors group-hover:text-primary sm:text-[17px]">{node.nomeAutorEmenda}</h3>
            <p className="mt-0.5 text-[11px] font-medium leading-5 text-muted-foreground">
              {formatCountCompact(node.totalEmendas ?? 0)} emendas registradas
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-3 min-[520px]:grid-cols-3 lg:w-[460px]">
          {/* Pago — destaque */}
          <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 px-4 py-3.5 shadow-sm backdrop-blur-md transition-colors group-hover:bg-primary/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/80">Pago</p>
            <p className="mt-1.5 text-base font-extrabold tracking-tight text-primary drop-shadow-sm">{formatCentsCompact(node.totalPagoCents)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{formatCents(node.totalPagoCents)}</p>
          </div>
          {/* Empenhado — neutro */}
          <div className="rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors group-hover:bg-white/90">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Empenhado</p>
            <p className="mt-1.5 text-sm font-extrabold tracking-tight text-foreground/80">{formatCentsCompact(node.totalEmpenhadoCents)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{formatCents(node.totalEmpenhadoCents)}</p>
          </div>
          {/* Liquidado — neutro */}
          <div className="rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors group-hover:bg-white/90">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Liquidado</p>
            <p className="mt-1.5 text-sm font-extrabold tracking-tight text-foreground/80">{formatCentsCompact(node.totalLiquidadoCents)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{formatCents(node.totalLiquidadoCents)}</p>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RankingsPage;
