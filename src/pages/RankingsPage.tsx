import { useMemo, useState } from "react";
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
  TopEmendaPais,
  TopGastadorEmenda,
} from "@/api/types";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_END_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const DEFAULT_START_YEAR = Math.max(2019, DEFAULT_END_YEAR - 5);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const typeChartColors = ["#0f766e", "#2563eb", "#f59e0b", "#14b8a6", "#7c3aed", "#ef4444"];
const rankIcons = [Crown, Trophy, Medal];
const ufOptions = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

type ScopeId = "parlamentares" | "deputados" | "senadores" | "geral" | "bancadas";

const scopeTabs: { id: ScopeId; label: string; icon: typeof Users; helper: string }[] = [
  {
    id: "parlamentares",
    label: "Parlamentares",
    icon: BarChart3,
    helper: "Recorte parlamentar sem bancadas",
  },
  {
    id: "deputados",
    label: "Deputados",
    icon: Users,
    helper: "Autores com cargo atual de deputado",
  },
  {
    id: "senadores",
    label: "Senadores",
    icon: Landmark,
    helper: "Autores com cargo atual de senador",
  },
  {
    id: "geral",
    label: "Geral",
    icon: Globe,
    helper: "Inclui parlamentares, bancadas e outros autores",
  },
  {
    id: "bancadas",
    label: "Bancadas",
    icon: Users,
    helper: "Somente bancadas, blocos, comissoes e partidos",
  },
];

const RankingsPage = () => {
  const [scope, setScope] = useState<ScopeId>("parlamentares");
  const [anoInicio, setAnoInicio] = useState(DEFAULT_START_YEAR);
  const [anoFim, setAnoFim] = useState(DEFAULT_END_YEAR);
  const [uf, setUf] = useState("");
  const [tipoEmenda, setTipoEmenda] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const filtro = useMemo<RankingEmendaFiltroInput>(() => {
    const base: RankingEmendaFiltroInput = {
      anoInicio,
      anoFim,
      uf: uf || undefined,
      tipoEmenda: tipoEmenda.trim() || undefined,
    };

    if (scope === "parlamentares") {
      return { ...base, apenasParlamentares: true };
    }
    if (scope === "deputados") {
      return { ...base, apenasParlamentares: true, cargoParlamentar: "DEPUTADO" };
    }
    if (scope === "senadores") {
      return { ...base, apenasParlamentares: true, cargoParlamentar: "SENADOR" };
    }
    if (scope === "bancadas") {
      return { ...base, apenasBancadas: true };
    }

    return { ...base, apenasParlamentares: false };
  }, [anoFim, anoInicio, scope, tipoEmenda, uf]);

  const resumoQuery = useEmendaRankingResumo(filtro);
  const serieQuery = useEmendaSerieAnual(filtro);
  const rankingQuery = useTopGastadoresCustom(filtro, { limit, offset });
  const tiposQuery = useTopTiposCustom(filtro, { limit: 6, offset: 0 });
  const paisesQuery = useTopEmendasPorPaisCustom(filtro, { limit: 6, offset: 0 });

  const resumo = resumoQuery.data;
  const rankingNodes = rankingQuery.data?.nodes ?? [];
  const totalRanking = rankingQuery.data?.total ?? 0;
  const seriesNodes = serieQuery.data?.nodes ?? [];
  const tiposNodes = (tiposQuery.data?.nodes ?? []).slice(0, 6);
  const paisNodes = (paisesQuery.data?.nodes ?? []).slice(0, 6);
  const singleYearNode = seriesNodes.length === 1 ? seriesNodes[0] : null;

  const serieChartData = useMemo(
    () =>
      seriesNodes.map((item: EmendaSerieAnualNode) => ({
        ano: String(item.ano),
        pago: centsToNumber(item.totalPagoCents),
        empenhado: centsToNumber(item.totalEmpenhadoCents),
        emendas: item.totalEmendas ?? 0,
      })),
    [seriesNodes]
  );

  const tipoChartData = useMemo(() => {
    const total = tiposNodes.reduce((acc, item) => acc + centsToNumber(item.totalPagoCents), 0);

    return tiposNodes.map((item, index) => {
      const value = centsToNumber(item.totalPagoCents);
      return {
        nome: item.tipoEmenda || "Nao informado",
        value,
        totalEmendas: item.totalEmendas ?? 0,
        color: typeChartColors[index % typeChartColors.length],
        share: total > 0 ? (value / total) * 100 : 0,
      };
    });
  }, [tiposNodes]);

  const annualHighlights = useMemo(() => {
    if (!seriesNodes.length) {
      return {
        strongestPaid: null as EmendaSerieAnualNode | null,
        strongestEmpenhado: null as EmendaSerieAnualNode | null,
        latestYear: null as EmendaSerieAnualNode | null,
      };
    }

    return {
      strongestPaid: [...seriesNodes].sort(
        (a, b) => centsToNumber(b.totalPagoCents) - centsToNumber(a.totalPagoCents)
      )[0],
      strongestEmpenhado: [...seriesNodes].sort(
        (a, b) => centsToNumber(b.totalEmpenhadoCents) - centsToNumber(a.totalEmpenhadoCents)
      )[0],
      latestYear: [...seriesNodes].sort((a, b) => b.ano - a.ano)[0],
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

  const activeScopeMeta = scopeTabs.find((tab) => tab.id === scope) ?? scopeTabs[0];
  const totalPagoCents = resumo?.totalPagoCents ?? "0";
  const totalEmpenhadoCents = resumo?.totalEmpenhadoCents ?? "0";
  const ticketMedioPagoCents = resumo?.ticketMedioPagoCents ?? "0";

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="rounded-[32px] border border-white/60 bg-card/90 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Panorama de emendas
                </p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Emendas com leitura completa por{" "}
                  <span className="text-gradient-primary">ano, autor e tipo</span>
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Um painel mais completo para enxergar volume financeiro, distribuicao anual,
                  concentracao por autores e composicao do gasto com mais clareza.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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

          <section className="mt-6 rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Controles do recorte
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha o escopo, o periodo e refinamentos pontuais antes de comparar os dados.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Limpar filtros
                </button>
              </div>

              <div className="overflow-x-auto overscroll-x-contain">
                <div className="flex min-w-max gap-2 pb-1">
                  {scopeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setScope(tab.id);
                        setOffset(0);
                      }}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                        scope === tab.id
                          ? "border-primary/30 bg-gradient-hero text-primary-foreground shadow-glow"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FilterField label="Ano inicial">
                  <select
                    value={anoInicio}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setAnoInicio(next);
                      if (next > anoFim) {
                        setAnoFim(next);
                      }
                      setOffset(0);
                    }}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                  >
                    {years.map((year) => (
                      <option key={`start-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Ano final">
                  <select
                    value={anoFim}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setAnoFim(next);
                      if (next < anoInicio) {
                        setAnoInicio(next);
                      }
                      setOffset(0);
                    }}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                  >
                    {years.map((year) => (
                      <option key={`end-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="UF">
                  <select
                    value={uf}
                    onChange={(e) => {
                      setUf(e.target.value);
                      setOffset(0);
                    }}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                  >
                    <option value="">Todas</option>
                    {ufOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Tipo de emenda">
                  <input
                    value={tipoEmenda}
                    onChange={(e) => {
                      setTipoEmenda(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="Ex.: Individual"
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </FilterField>

                <FilterField label="Resultados">
                  <div className="flex h-11 items-center rounded-2xl border border-border bg-muted/50 px-3 text-sm font-medium text-foreground">
                    {formatCountCompact(totalRanking)} autores
                  </div>
                </FilterField>
              </div>
            </div>
          </section>

          <section className="mt-6">
            {resumoQuery.isLoading && !resumo ? <LoadingState message="Carregando resumo de emendas..." /> : null}
            {resumoQuery.error && !resumo ? <ErrorState error={resumoQuery.error as Error} /> : null}

            {resumo ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Evolucao anual</h2>
                  <p className="text-sm text-muted-foreground">
                    Pago e empenhado por ano para comparar ritmo de execucao.
                  </p>
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                  {anoInicio} a {anoFim}
                </div>
              </div>

              {serieQuery.isLoading ? <LoadingState message="Carregando serie anual..." /> : null}
              {serieQuery.error ? <ErrorState error={serieQuery.error as Error} /> : null}
              {!serieQuery.isLoading && !serieQuery.error && !serieChartData.length ? (
                <EmptyState message="Nenhuma serie anual encontrada para este recorte." />
              ) : null}

              {singleYearNode ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InsightPill
                      label="Ano observado"
                      value={String(singleYearNode.ano)}
                      helper="Recorte com um unico ano"
                    />
                    <InsightPill
                      label="Pago"
                      value={formatCentsCompact(singleYearNode.totalPagoCents)}
                      helper={formatCents(singleYearNode.totalPagoCents)}
                    />
                    <InsightPill
                      label="Empenhado"
                      value={formatCentsCompact(singleYearNode.totalEmpenhadoCents)}
                      helper={formatCents(singleYearNode.totalEmpenhadoCents)}
                    />
                    <InsightPill
                      label="Emendas"
                      value={formatCountCompact(singleYearNode.totalEmendas ?? 0)}
                      helper={`${(singleYearNode.totalAutores ?? 0).toLocaleString("pt-BR")} autores`}
                    />
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                      Pago
                      <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                      Empenhado
                    </div>

                    <div className="mt-4 space-y-3">
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
                        ratio={
                          Math.min(
                            1,
                            Math.max(
                              0.18,
                              centsToNumber(singleYearNode.totalEmpenhadoCents) > 0
                                ? centsToNumber(singleYearNode.totalPagoCents) /
                                  centsToNumber(singleYearNode.totalEmpenhadoCents)
                                : 0
                            )
                          )
                        }
                        tone="secondary"
                      />
                    </div>
                  </div>
                </div>
              ) : serieChartData.length ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InsightPill
                      label="Maior pago"
                      value={
                        annualHighlights.strongestPaid
                          ? `${annualHighlights.strongestPaid.ano}`
                          : "-"
                      }
                      helper={
                        annualHighlights.strongestPaid
                          ? formatCentsCompact(annualHighlights.strongestPaid.totalPagoCents)
                          : "Sem dado"
                      }
                    />
                    <InsightPill
                      label="Maior empenhado"
                      value={
                        annualHighlights.strongestEmpenhado
                          ? `${annualHighlights.strongestEmpenhado.ano}`
                          : "-"
                      }
                      helper={
                        annualHighlights.strongestEmpenhado
                          ? formatCentsCompact(annualHighlights.strongestEmpenhado.totalEmpenhadoCents)
                          : "Sem dado"
                      }
                    />
                    <InsightPill
                      label="Ultimo ano"
                      value={annualHighlights.latestYear ? `${annualHighlights.latestYear.ano}` : "-"}
                      helper={
                        annualHighlights.latestYear
                          ? `${formatCountCompact(annualHighlights.latestYear.totalEmendas ?? 0)} emendas`
                          : "Sem dado"
                      }
                    />
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/70 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        Pago
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        Empenhado
                      </span>
                    </div>

                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={serieChartData} margin={{ top: 12, left: 0, right: 0, bottom: 8 }}>
                          <defs>
                            <linearGradient id="emendasPagoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(182 89% 30%)" stopOpacity={0.85} />
                              <stop offset="100%" stopColor="hsl(182 89% 30%)" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="emendasEmpenhadoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(212 93% 47%)" stopOpacity={0.75} />
                              <stop offset="100%" stopColor="hsl(212 93% 47%)" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="hsl(206 26% 82%)" strokeDasharray="3 3" />
                          <XAxis dataKey="ano" tickLine={false} axisLine={false} fontSize={11} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            width={74}
                            tickFormatter={(value) => `R$ ${(value / 1_000_000).toFixed(0)} mi`}
                          />
                          <RechartsTooltip
                            formatter={(value: number) =>
                              value.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                maximumFractionDigits: 0,
                              })
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="empenhado"
                            stroke="hsl(212 93% 47%)"
                            fill="url(#emendasEmpenhadoGradient)"
                            strokeWidth={2}
                            name="Empenhado"
                          />
                          <Area
                            type="monotone"
                            dataKey="pago"
                            stroke="hsl(182 89% 30%)"
                            fill="url(#emendasPagoGradient)"
                            strokeWidth={3}
                            name="Pago"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-foreground">Composicao por tipo</h2>
                  <p className="text-sm text-muted-foreground">
                    Distribuicao do valor pago entre os tipos mais relevantes do recorte.
                  </p>
                </div>

                {tiposQuery.isLoading ? <LoadingState message="Carregando tipos..." /> : null}
                {tiposQuery.error ? <ErrorState error={tiposQuery.error as Error} /> : null}
                {!tiposQuery.isLoading && !tiposQuery.error && !tipoChartData.length ? (
                  <EmptyState message="Sem tipos suficientes para montar o grafico." />
                ) : null}

                {tipoChartData.length ? (
                  <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="mx-auto h-[220px] w-[220px]">
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
                          >
                            {tipoChartData.map((item) => (
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
                      {tipoChartData.map((item) => (
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

              <section className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-foreground">Paises e localidade</h2>
                  <p className="text-sm text-muted-foreground">
                    Onde o recorte se concentrou quando observamos a localidade de aplicacao.
                  </p>
                </div>

                {paisesQuery.isLoading ? <LoadingState message="Carregando paises..." /> : null}
                {paisesQuery.error ? <ErrorState error={paisesQuery.error as Error} /> : null}
                {!paisesQuery.isLoading && !paisesQuery.error && !paisNodes.length ? (
                  <EmptyState message="Nenhum pais encontrado para este recorte." />
                ) : null}

                <div className="space-y-2">
                  {paisNodes.map((item: TopEmendaPais, index) => (
                    <div
                      key={`${item.pais}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {index + 1}. {item.pais}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCountCompact(item.totalEmendas ?? 0)} emendas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatCentsCompact(item.totalPagoCents)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatCents(item.totalPagoCents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Principais autores do recorte</h2>
                <p className="text-sm text-muted-foreground">
                  Ranking detalhado com valor pago, empenhado e volume de emendas.
                </p>
              </div>

              <div className="rounded-2xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                {formatCentsCompact(totalEmpenhadoCents)} empenhados no recorte
              </div>
            </div>

            {rankingQuery.isLoading ? <LoadingState message="Carregando ranking de autores..." /> : null}
            {rankingQuery.error ? <ErrorState error={rankingQuery.error as Error} /> : null}
            {!rankingQuery.isLoading && !rankingQuery.error && !rankingNodes.length ? (
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
              <PaginationControls
                total={totalRanking}
                limit={limit}
                offset={offset}
                onPageChange={setOffset}
                pageSizeOptions={[10, 20, 30]}
                onPageSizeChange={(pageSize) => {
                  setLimit(pageSize);
                  setOffset(0);
                }}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

const HeroSummaryCard = ({
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

const InsightPill = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-[22px] border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
  </div>
);

const AnnualBar = ({
  label,
  value,
  helper,
  ratio,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  ratio: number;
  tone: "primary" | "secondary";
}) => {
  const width = `${Math.min(100, Math.max(12, ratio * 100))}%`;

  return (
    <div className="rounded-[22px] border border-border/70 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-1 text-base font-bold ${tone === "primary" ? "text-primary" : "text-blue-600"}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>

      <div className="mt-4 h-3 rounded-full bg-muted">
        <div
          className={`h-3 rounded-full ${
            tone === "primary"
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
              : "bg-gradient-to-r from-blue-500 to-sky-500"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
};

const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label className="space-y-2">
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </span>
    {children}
  </label>
);

const RankingAuthorRow = ({
  node,
  rank,
}: {
  node: TopGastadorEmenda;
  rank: number;
}) => {
  const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <article className="rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-soft text-primary">
            {RankIcon ? <RankIcon className="h-4.5 w-4.5" /> : <span className="text-xs font-bold">#{rank}</span>}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
              {node.nomeAutorEmenda}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCountCompact(node.totalEmendas ?? 0)} emendas registradas
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <MetricPill
            label="Pago"
            value={formatCentsCompact(node.totalPagoCents)}
            helper={formatCents(node.totalPagoCents)}
            tone="primary"
          />
          <MetricPill
            label="Empenhado"
            value={formatCentsCompact(node.totalEmpenhadoCents)}
            helper={formatCents(node.totalEmpenhadoCents)}
          />
          <MetricPill
            label="Liquidado"
            value={formatCentsCompact(node.totalLiquidadoCents)}
            helper={formatCents(node.totalLiquidadoCents)}
          />
        </div>
      </div>
    </article>
  );
};

const MetricPill = ({
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
    className={`rounded-2xl border px-3 py-3 ${
      tone === "primary"
        ? "border-primary/25 bg-primary/10"
        : "border-border/70 bg-card/60"
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

export default RankingsPage;
