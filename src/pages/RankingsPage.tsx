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

import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
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
          nome: item.tipoEmenda || "Nao informado",
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
          nome: item.pais || "Nao informado",
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

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:pt-10">

          {/* ── Hero ── */}
          <section className="rounded-3xl border border-border bg-card px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <FileText className="h-3 w-3" />
                  Panorama de emendas
                </p>
                <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-[2.4rem]">
                  Emendas por{" "}
                  <span className="text-primary">ano, autor e tipo</span>
                </h1>
                <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted-foreground">
                  Painel completo para enxergar volume financeiro, distribuicao anual,
                  concentracao por autores e composicao do gasto com mais clareza.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 xl:w-[400px] xl:shrink-0">
                <HeroSummaryCard
                  label="Escopo"
                  value={activeScopeMeta.label}
                  helper={activeScopeMeta.helper}
                />
                <HeroSummaryCard
                  label="Periodo"
                  value={`${anoInicio} - ${anoFim}`}
                  helper="Recorte anual aplicado"
                />
                <HeroSummaryCard
                  label="UF / tipo"
                  value={uf || "Todas"}
                  helper={tipoEmenda.trim() || "Todos os tipos"}
                />
              </div>
            </div>
          </section>

          {/* ── Filters + scope tabs ── */}
          <section className="mt-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Controles do recorte</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Escolha o escopo, o periodo e refinamentos antes de comparar os dados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              </div>

              {/* Scope tabs */}
              <div className="overflow-x-auto overscroll-x-contain">
                <div className="flex min-w-max gap-2 pb-1">
                  {scopeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setScope(tab.id); setOffset(0); }}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                        scope === tab.id
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter fields */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FilterField label="Ano inicial">
                  <select
                    value={anoInicio}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setAnoInicio(next);
                      if (next > anoFim) setAnoFim(next);
                      setOffset(0);
                    }}
                    className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
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
                    className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
                  >
                    {years.map((year) => <option key={`end-${year}`} value={year}>{year}</option>)}
                  </select>
                </FilterField>

                <FilterField label="UF">
                  <select
                    value={uf}
                    onChange={(e) => { setUf(e.target.value); setOffset(0); }}
                    className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
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
                    className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </FilterField>

                <FilterField label="Resultados">
                  <div className="flex h-10 items-center rounded-2xl border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
                    {formatCountCompact(totalRanking)} autores
                  </div>
                </FilterField>
              </div>
            </div>
          </section>

          {/* ── KPIs ── */}
          <section className="mt-4">
            {resumoQuery.isLoading && !resumo ? <LoadingState message="Carregando resumo de emendas..." /> : null}
            {resumoQuery.error && !resumo ? <ErrorState error={resumoQuery.error as Error} /> : null}

            {resumo ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                  label="Total pago"
                  value={formatCentsCompact(totalPagoCents)}
                  helper={formatCents(totalPagoCents)}
                  description={`Escopo ${activeScopeMeta.label.toLowerCase()}`}
                  icon={Landmark}
                  variant="green"
                />
                <StatsCard
                  label="Total emendas"
                  value={formatCountCompact(resumo.totalEmendas ?? 0)}
                  helper={(resumo.totalEmendas ?? 0).toLocaleString("pt-BR")}
                  description="Registros consolidados no recorte"
                  icon={FileText}
                  variant="blue"
                />
                <StatsCard
                  label="Autores distintos"
                  value={formatCountCompact(resumo.totalAutores ?? 0)}
                  helper={(resumo.totalAutores ?? 0).toLocaleString("pt-BR")}
                  description="Autores ou grupos identificados"
                  icon={Users}
                  variant="yellow"
                />
                <StatsCard
                  label="Ticket medio pago"
                  value={formatCentsCompact(ticketMedioPagoCents)}
                  helper={formatCents(ticketMedioPagoCents)}
                  description={`${formatCountCompact(resumo.totalTipos ?? 0)} tipos e ${formatCountCompact(resumo.totalPaises ?? 0)} paises`}
                  icon={PieChartIcon}
                  variant="blue"
                />
              </div>
            ) : null}
          </section>

          {/* ── Charts row ── */}
          <section className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">

            {/* Annual evolution */}
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Evolucao anual</h2>
                  <p className="text-xs text-muted-foreground">
                    Pago e empenhado por ano para comparar ritmo de execucao.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {anoInicio} – {anoFim}
                </div>
              </div>

              {!serieReady || serieQuery.isLoading ? <LoadingState message="Carregando serie anual..." /> : null}
              {serieQuery.error && !hasSerieData ? <ErrorState error={serieQuery.error as Error} /> : null}
              {serieReady && !serieQuery.isLoading && !serieQuery.error && !hasSerieData ? (
                <EmptyState message="Nenhuma serie anual encontrada para este recorte." />
              ) : null}

              {singleYearNode ? (
                <div className="space-y-3">
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <InsightPill label="Ano observado" value={String(singleYearNode.ano)}                                       helper="Recorte com um unico ano" />
                    <InsightPill label="Pago"           value={formatCentsCompact(singleYearNode.totalPagoCents)}               helper={formatCents(singleYearNode.totalPagoCents)} />
                    <InsightPill label="Empenhado"      value={formatCentsCompact(singleYearNode.totalEmpenhadoCents)}          helper={formatCents(singleYearNode.totalEmpenhadoCents)} />
                    <InsightPill label="Emendas"        value={formatCountCompact(singleYearNode.totalEmendas ?? 0)}            helper={`${(singleYearNode.totalAutores ?? 0).toLocaleString("pt-BR")} autores`} />
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Pago
                      </span>
                      <MoveRight className="h-3 w-3" />
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Empenhado
                      </span>
                    </div>

                    <div className="space-y-3">
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
                <div className="space-y-3">
                  <div className="grid gap-2.5 sm:grid-cols-3">
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
                      label="Ultimo ano"
                      value={annualHighlights.latestYear ? `${annualHighlights.latestYear.ano}` : "-"}
                      helper={annualHighlights.latestYear ? `${formatCountCompact(annualHighlights.latestYear.totalEmendas ?? 0)} emendas` : "Sem dado"}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Pago
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Empenhado
                      </span>
                    </div>

                    <div className="h-[260px]">
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
                          <CartesianGrid vertical={false} stroke="hsl(206 26% 90%)" strokeDasharray="3 3" />
                          <XAxis dataKey="ano"  tickLine={false} axisLine={false} fontSize={11} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            width={74}
                            tickFormatter={(value) => `R$ ${(value / 1_000_000).toFixed(0)} mi`}
                          />
                          <RechartsTooltip
                            formatter={(value: number) =>
                              value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                            }
                          />
                          <Area type="monotone" dataKey="empenhado" stroke="hsl(212 93% 47%)" fill="url(#emendasEmpenhadoGradient)" strokeWidth={2} name="Empenhado" />
                          <Area type="monotone" dataKey="pago"      stroke="hsl(182 89% 30%)" fill="url(#emendasPagoGradient)"      strokeWidth={2.5} name="Pago" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Tipo chart */}
              <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-base font-bold text-foreground">Composicao por tipo</h2>
                  <p className="text-xs text-muted-foreground">
                    Distribuicao do valor pago entre os tipos mais relevantes.
                  </p>
                </div>

                {!tiposReady || tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                {tiposQuery.error && !hasTipoData ? <ErrorState error={tiposQuery.error as Error} /> : null}
                {tiposReady && !tiposQuery.isLoading && !tiposQuery.error && !hasTipoData ? (
                  <EmptyState message="Sem tipos suficientes para montar o grafico." />
                ) : null}

                {tipoChartData.length ? (
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="min-w-0 overflow-hidden rounded-[28px] border border-border bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-5">
                      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={tipoChartData}
                              dataKey="value"
                              nameKey="nome"
                              cx="50%"
                              cy="50%"
                              innerRadius={58}
                              outerRadius={92}
                              paddingAngle={2}
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
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="w-full max-w-[132px] rounded-full border border-border bg-card/95 px-3 py-3 text-center shadow-sm backdrop-blur-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Top 6</p>
                            <p className="mt-1 text-lg font-bold text-foreground">{tipoCoverage.toFixed(1)}%</p>
                            <p className="text-[11px] text-muted-foreground">do valor pago</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                        <BreakdownStatCard
                          label="Tipo lider"
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
                          shareLabel={`${item.share.toFixed(1)}% do pago`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Países */}
              <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-foreground">Localidade de aplicacao</h2>
                  <p className="text-xs text-muted-foreground">
                    Veja onde o valor pago mais se concentra dentro do recorte ativo.
                  </p>
                </div>

                {!paisesReady || paisesQuery.isLoading ? <LoadingState message="Carregando paises..." /> : null}
                {paisesQuery.error && !hasPaisData ? <ErrorState error={paisesQuery.error as Error} /> : null}
                {paisesReady && !paisesQuery.isLoading && !paisesQuery.error && !hasPaisData ? (
                  <EmptyState message="Nenhum pais encontrado para este recorte." />
                ) : null}

                {paisChartData.length ? (
                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <BreakdownStatCard
                        label="Lider geografico"
                        value={topPais?.nome ?? "-"}
                        helper={topPais ? formatCentsCompact(topPais.totalPagoCents) : "Sem dado"}
                      />
                      <BreakdownStatCard
                        label="Cobertura top 6"
                        value={`${paisCoverage.toFixed(1)}%`}
                        helper="Participacao sobre o valor pago"
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
                          shareLabel={`${item.share.toFixed(1)}% do pago`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          {/* ── Ranking table ── */}
          <section className="mt-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Principais autores do recorte</h2>
                <p className="text-xs text-muted-foreground">
                  Ranking detalhado com valor pago, empenhado e volume de emendas.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {formatCentsCompact(totalEmpenhadoCents)} empenhados
              </div>
            </div>

            {rankingQuery.isLoading ? <LoadingState message="Carregando ranking de autores..." /> : null}
            {rankingQuery.error && !hasRankingData ? <ErrorState error={rankingQuery.error as Error} /> : null}
            {!rankingQuery.isLoading && !rankingQuery.error && !hasRankingData ? (
              <EmptyState message="Nenhum autor encontrado com esse filtro." />
            ) : null}

            <div className="space-y-2.5">
              {rankingNodes.map((node, index) => (
                <RankingAuthorRow
                  key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${offset + index}`}
                  node={node}
                  rank={offset + index + 1}
                />
              ))}
            </div>

            {totalRanking > 0 ? (
              <PaginationControls
                total={totalRanking}
                limit={limit}
                offset={offset}
                onPageChange={setOffset}
                pageSizeOptions={[10, 20, 30]}
                onPageSizeChange={(pageSize) => { setLimit(pageSize); setOffset(0); }}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────────── sub-components ── */

const HeroSummaryCard = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="rounded-2xl border border-border bg-muted/30 p-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm font-bold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{helper}</p>
  </div>
);

const InsightPill = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="rounded-2xl border border-border bg-background px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1.5 text-base font-bold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{helper}</p>
  </div>
);

const BreakdownStatCard = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="min-w-0 overflow-hidden rounded-[22px] border border-border bg-background px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-foreground sm:text-base">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{helper}</p>
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
    <article className="min-w-0 overflow-hidden rounded-[24px] border border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-[11px] font-bold"
            style={{
              color: accentColor,
              borderColor: `${accentColor}33`,
              backgroundColor: `${accentColor}14`,
            }}
          >
            {eyebrow}
          </div>

          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="min-w-0 flex items-end justify-between gap-3 min-[520px]:block min-[520px]:text-right">
          <p className="break-words text-sm font-bold text-foreground">{value}</p>
          <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{shareLabel}</p>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-border/60">
        <div className="h-2 rounded-full" style={{ width, backgroundColor: accentColor }} />
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
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className={`mt-1 text-base font-bold ${tone === "primary" ? "text-primary" : "text-blue-600"}`}>{value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{helper}</p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-border/60">
        <div
          className={`h-2 rounded-full ${tone === "primary" ? "bg-primary" : "bg-blue-500"}`}
          style={{ width }}
        />
      </div>
    </div>
  );
};

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="space-y-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

const RankingAuthorRow = ({ node, rank }: { node: TopGastadorEmenda; rank: number }) => {
  const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <article className="rounded-[28px] border border-border bg-background px-4 py-4 transition-all duration-150 hover:border-primary/30 hover:bg-muted/20 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Rank + name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            {RankIcon
              ? <RankIcon className="h-4 w-4 text-primary" />
              : <span className="text-xs font-bold">#{rank}</span>
            }
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground sm:text-base">{node.nomeAutorEmenda}</h3>
            <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
              {formatCountCompact(node.totalEmendas ?? 0)} emendas registradas
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-2 min-[520px]:grid-cols-3 lg:w-[440px]">
          {/* Pago — destaque */}
          <div className="rounded-2xl border border-primary/20 bg-primary/8 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70">Pago</p>
            <p className="mt-1 text-sm font-bold text-primary">{formatCentsCompact(node.totalPagoCents)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{formatCents(node.totalPagoCents)}</p>
          </div>
          {/* Empenhado — neutro */}
          <div className="rounded-2xl border border-border bg-muted/20 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Empenhado</p>
            <p className="mt-1 text-sm font-semibold text-foreground/70">{formatCentsCompact(node.totalEmpenhadoCents)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{formatCents(node.totalEmpenhadoCents)}</p>
          </div>
          {/* Liquidado — neutro */}
          <div className="rounded-2xl border border-border bg-muted/20 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Liquidado</p>
            <p className="mt-1 text-sm font-semibold text-foreground/70">{formatCentsCompact(node.totalLiquidadoCents)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{formatCents(node.totalLiquidadoCents)}</p>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RankingsPage;
