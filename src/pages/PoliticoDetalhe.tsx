import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Globe,
  GraduationCap,
  Landmark,
  Link as LinkIcon,
  Mail,
  MapPin,
  Plane,
  Phone,
  FileText,
  Scale,
  User,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
import ShareActions from "@/components/ShareActions";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { PoliticoNewsSection } from "@/components/politicos/PoliticoNewsSection";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePoliticoDossieCompleto,
  usePoliticoNoticias,
} from "@/hooks/usePoliticos";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  formatDate,
  toBigInt,
} from "@/lib/formatters";
import { buildPoliticoPath, getPoliticoLookupValue } from "@/lib/politicos";
import type { Emenda, PerfilExterno, Viagem } from "@/api/types";

const PAGE_SIZE = 10;
const LEXML_PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_END_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const pieColors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];

const PoliticoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [anoInicio, setAnoInicio] = useState(2019);
  const [anoFim, setAnoFim] = useState(DEFAULT_END_YEAR);
  const [viagensOffset, setViagensOffset] = useState(0);
  const [emendasOffset, setEmendasOffset] = useState(0);
  const [lexmlOffset, setLexmlOffset] = useState(0);

  const routeLookup = decodeURIComponent(id || "").trim();
  const nomeBusca = getPoliticoLookupValue(routeLookup);
  const { data: politico, isLoading, error } = usePoliticoDossieCompleto(nomeBusca, {
    anoInicio,
    anoFim,
    viagensLimit: PAGE_SIZE,
    viagensOffset,
    emendasLimit: PAGE_SIZE,
    emendasOffset,
    lexmlLimit: LEXML_PAGE_SIZE,
    lexmlOffset,
    passagensLimit: 12,
    pagamentosLimit: 12,
    trechosLimit: 12,
    conveniosLimit: 12,
    favorecidosLimit: 12,
    includePerfilExterno: false,
    includePassagens: false,
    includePagamentos: false,
    includeTrechos: true,
    includeConvenios: false,
    includeFavorecidos: false,
  });
  const { data: politicoPerfilExterno, isLoading: isPerfilExternoLoading } = usePoliticoDossieCompleto(
    politico ? nomeBusca : undefined,
    {
      lexmlLimit: LEXML_PAGE_SIZE,
      lexmlOffset,
      includePerfilExterno: true,
      includeGastos: false,
      includeEmendasResumo: false,
      includeViagens: false,
      includeEmendas: false,
      includePassagens: false,
      includePagamentos: false,
      includeTrechos: false,
      includeConvenios: false,
      includeFavorecidos: false,
      includeTse: true,
    }
  );
  const nomePoliticoNoticias = politico
    ? politico.nomeCompleto || politico.nomeCanonico?.replace(/-/g, " ") || nomeBusca.replace(/-/g, " ")
    : "";
  const {
    data: noticias,
    isLoading: isNoticiasLoading,
    error: noticiasError,
    refetch: refetchNoticias,
  } = usePoliticoNoticias(nomePoliticoNoticias, 6);

  useEffect(() => {
    setLexmlOffset(0);
  }, [nomeBusca]);

  useEffect(() => {
    if (!routeLookup) {
      return;
    }

    const canonicalPath = buildPoliticoPath(routeLookup);
    if (canonicalPath !== location.pathname) {
      navigate(canonicalPath, { replace: true });
    }
  }, [location.pathname, navigate, routeLookup]);

  const gastos = politico?.gastos;
  const totalDiariasCents = toBigInt(gastos?.totalDiariasCents);
  const totalPassagensCents = toBigInt(gastos?.totalPassagensCents);
  const totalOutrosGastosCents = toBigInt(gastos?.totalOutrosGastosCents);
  const totalDevolucaoCents = toBigInt(gastos?.totalDevolucaoCents);
  const totalPagamentosCents = toBigInt(gastos?.totalPagamentosCents);
  const totalGastoBrutoCents =
    totalDiariasCents + totalPassagensCents + totalOutrosGastosCents;
  const totalGastoLiquidoCents = totalGastoBrutoCents - totalDevolucaoCents;

  const viagensNodes = politico?.viagens?.nodes ?? [];
  const viagensTotalApi = politico?.viagens?.total ?? viagensNodes.length;
  const viagensTotalView = viagensTotalApi;
  const viagensPage = viagensNodes;

  const emendasNodes = politico?.emendas?.nodes ?? [];
  const emendasTotalApi = politico?.emendas?.total ?? emendasNodes.length;
  const emendasTotalView = emendasTotalApi;
  const emendasPage = emendasNodes;

  const emendasResumo = useMemo(
    () => politico?.emendasResumo ?? buildEmendasResumo(emendasNodes),
    [emendasNodes, politico?.emendasResumo]
  );

  const perfilExterno = politicoPerfilExterno?.perfilExterno ?? politico?.perfilExterno;

  const fotoUrl =
    politico?.fotoUrl ||
    perfilExterno?.camara?.urlFoto ||
    perfilExterno?.senado?.urlFoto;
  const politicoDisplayName =
    politico?.nomeCompleto ||
    politico?.nomeCanonico ||
    nomeBusca.replace(/-/g, " ");
  const politicoShareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const pieData = useMemo(() => {
    if (!gastos) return [];

    const source = [
      { name: "Diarias", value: centsToNumber(totalDiariasCents.toString()) },
      { name: "Passagens", value: centsToNumber(totalPassagensCents.toString()) },
      { name: "Outros", value: centsToNumber(totalOutrosGastosCents.toString()) },
    ];
    const filtered = source.filter((item) => item.value > 0);
    const total = filtered.reduce((acc, item) => acc + item.value, 0);

    return filtered.map((item, index) => ({
      ...item,
      color: pieColors[index % pieColors.length],
      share: total > 0 ? (item.value / total) * 100 : 0,
    }));
  }, [gastos, totalDiariasCents, totalOutrosGastosCents, totalPassagensCents]);

  const totalGastos = useMemo(() => {
    if (!gastos) return "R$ 0,00";

    return formatCents(totalGastoLiquidoCents.toString());
  }, [gastos, totalGastoLiquidoCents]);

  const handlePeriodChange = (start: number, end: number) => {
    if (start > end) return;
    setAnoInicio(start);
    setAnoFim(end);
    setViagensOffset(0);
    setEmendasOffset(0);
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>

          {isLoading ? <DossieSkeleton /> : null}
          {error ? <ErrorState error={error as Error} /> : null}
          {!isLoading && !error && !politico ? (
            <EmptyState message={`Nenhum dossie encontrado para "${nomeBusca}".`} />
          ) : null}

          {politico ? (
            <div className="space-y-6">
              <section className="animate-fade-up rounded-[32px] border border-white/60 bg-card/85 p-5 shadow-elevated backdrop-blur-sm sm:p-6">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={politico.nomeCanonico}
                        className="h-24 w-24 rounded-[24px] object-cover shadow-card sm:h-28 sm:w-28"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-muted sm:h-28 sm:w-28">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        <User className="h-3.5 w-3.5" />
                        Perfil completo
                      </p>
                      <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                        {politico.nomeCompleto || politico.nomeCanonico}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {politico.partido ? (
                          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
                            {politico.partido}
                          </span>
                        ) : null}
                        {politico.uf ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {politico.uf}
                          </span>
                        ) : null}
                        {politico.cargoAtual ? (
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
                            {politico.cargoAtual}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Dossie consolidado de viagens oficiais, emendas parlamentares e referencias externas no recorte de{" "}
                        <strong className="text-foreground">
                          {anoInicio} a {anoFim}
                        </strong>.
                      </p>

                      <ShareActions
                        label="Compartilhar perfil"
                        title={`${politicoDisplayName} | Radar do Povo`}
                        text={`Veja o perfil completo de ${politicoDisplayName} no Radar do Povo, com viagens e emendas no recorte de ${anoInicio} a ${anoFim}.`}
                        url={politicoShareUrl}
                        className="mt-4"
                      />

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {politico.dataNascimento ? (
                          <span>Nascimento: {formatDate(politico.dataNascimento)}</span>
                        ) : null}
                        {perfilExterno?.camara?.email ||
                        perfilExterno?.senado?.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {perfilExterno?.camara?.email ||
                              perfilExterno?.senado?.email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-border/70 bg-white/80 p-4 shadow-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Recorte do dossie
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {anoInicio} a {anoFim}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Ajuste o periodo para recalcular viagens e emendas do perfil.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <label className="rounded-2xl border border-border bg-background/90 px-3 py-2 font-semibold shadow-sm">
                        <span className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Inicio
                        </span>
                        <select
                          value={anoInicio}
                          onChange={(e) => handlePeriodChange(Number(e.target.value), anoFim)}
                          className="w-full bg-transparent text-sm outline-none"
                        >
                          {years.map((year) => (
                            <option key={`start-${year}`} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="rounded-2xl border border-border bg-background/90 px-3 py-2 font-semibold shadow-sm">
                        <span className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Fim
                        </span>
                        <select
                          value={anoFim}
                          onChange={(e) => handlePeriodChange(anoInicio, Number(e.target.value))}
                          className="w-full bg-transparent text-sm outline-none"
                        >
                          {years.map((year) => (
                            <option key={`end-${year}`} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                  label="Gasto liquido em viagens"
                  value={formatCentsCompact(totalGastoLiquidoCents.toString())}
                  helper={totalGastos}
                  icon={Banknote}
                />
                <MetricCard
                  label="Total viagens"
                  value={formatCountCompact(gastos?.totalViagens ?? viagensTotalApi)}
                  helper={(gastos?.totalViagens ?? viagensTotalApi).toLocaleString("pt-BR")}
                  icon={Plane}
                />
                <MetricCard
                  label="Total emendas"
                  value={formatCountCompact(emendasTotalApi)}
                  helper={emendasTotalApi.toLocaleString("pt-BR")}
                  icon={FileText}
                />
                <MetricCard
                  label="Pago em emendas"
                  value={formatCentsCompact(emendasResumo.totalPagoCents)}
                  helper={formatCents(emendasResumo.totalPagoCents)}
                  icon={Landmark}
                />
              </section>

              <PoliticoNewsSection
                politico={nomePoliticoNoticias}
                items={noticias?.items ?? []}
                total={noticias?.total ?? 0}
                isLoading={isNoticiasLoading}
                error={noticiasError as Error | null}
                onRetry={() => {
                  void refetchNoticias();
                }}
              />

              <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <div className="min-w-0 rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6 xl:flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-foreground sm:text-lg">
                        Composicao das viagens
                      </h2>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Peso relativo de diarias, passagens e outros gastos no periodo.
                      </p>
                    </div>
                    <div className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                      {anoInicio}-{anoFim}
                    </div>
                  </div>

                  {pieData.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState message="Sem valores de gastos para este periodo." />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="rounded-[28px] bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4 ring-1 ring-border/60">
                        <div className="relative mx-auto h-[200px] w-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={58}
                                paddingAngle={3}
                                stroke="#ffffff"
                                strokeWidth={4}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
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
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Gasto liquido
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                              {formatCentsCompact(totalGastoLiquidoCents.toString())}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              apos devolucoes
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {pieData.map((item) => (
                          <div
                            key={item.name}
                            className="rounded-[22px] border border-border/70 bg-background/85 px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <p className="text-sm font-semibold text-foreground">
                                    {item.name}
                                  </p>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  {formatCents(String(Math.round(item.value * 100)))}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold text-primary">
                                  {item.share.toFixed(1)}%
                                </p>
                                <p className="text-[11px] text-muted-foreground">do bruto</p>
                              </div>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border/70">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.max(item.share, 8)}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4 xl:w-[320px] xl:flex-none">
                  <section className="rounded-[24px] border border-border/70 bg-card/85 p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-bold">Painel financeiro</h2>
                    <div className="space-y-2 text-xs">
                      <SummaryRow
                        label="Gasto bruto"
                        value={formatCentsCompact(totalGastoBrutoCents.toString())}
                        helper={formatCents(totalGastoBrutoCents.toString())}
                      />
                      <SummaryRow
                        label="Devolucoes"
                        value={formatCentsCompact(totalDevolucaoCents.toString())}
                        helper={formatCents(totalDevolucaoCents.toString())}
                      />
                      <SummaryRow
                        label="Pagamentos registrados"
                        value={formatCentsCompact(totalPagamentosCents.toString())}
                        helper={formatCents(totalPagamentosCents.toString())}
                      />
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-border/70 bg-card/85 p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-bold">Resumo de emendas</h2>
                    <div className="space-y-2 text-xs">
                      <SummaryRow
                        label="Empenhado"
                        value={formatCentsCompact(emendasResumo.totalEmpenhadoCents)}
                        helper={formatCents(emendasResumo.totalEmpenhadoCents)}
                      />
                      <SummaryRow
                        label="Liquidado"
                        value={formatCentsCompact(emendasResumo.totalLiquidadoCents)}
                        helper={formatCents(emendasResumo.totalLiquidadoCents)}
                      />
                      <SummaryRow
                        label="Pago"
                        value={formatCentsCompact(emendasResumo.totalPagoCents)}
                        helper={formatCents(emendasResumo.totalPagoCents)}
                      />
                      <SummaryRow
                        label="Favorecidos (carga atual)"
                        value={formatCountCompact(emendasResumo.totalFavorecidos)}
                        helper={emendasResumo.totalFavorecidos.toLocaleString("pt-BR")}
                      />
                      <SummaryRow
                        label="Recebido por favorecidos"
                        value={formatCentsCompact(emendasResumo.totalRecebidoFavorecidosCents)}
                        helper={formatCents(emendasResumo.totalRecebidoFavorecidosCents)}
                      />
                    </div>
                  </section>
                </div>
              </section>

              <section className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
                      <Plane className="h-4.5 w-4.5 text-accent" />
                      Viagens
                    </h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Registros paginados de deslocamento no recorte selecionado.
                    </p>
                  </div>
                  <div className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    {formatCountCompact(viagensTotalView)} viagens
                  </div>
                </div>

                {viagensPage.length === 0 ? (
                  <EmptyState message="Nenhuma viagem registrada neste periodo." />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {viagensPage.map((viagem, index) => (
                        <MobileViagemCard key={viagem.processoId || index} viagem={viagem} />
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[700px] text-xs">
                        <thead>
                          <tr className="border-b border-border/80 text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-semibold">Periodo</th>
                            <th className="pb-2 pr-4 font-semibold">Motivo</th>
                            <th className="pb-2 pr-4 font-semibold">Trechos</th>
                            <th className="pb-2 text-right font-semibold">Diarias</th>
                            <th className="pb-2 text-right font-semibold">Passagens</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {viagensPage.map((viagem, index) => (
                            <tr key={viagem.processoId || index} className="hover:bg-muted/35">
                              <td className="py-2.5 pr-4 text-muted-foreground">
                                {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
                              </td>
                              <td className="max-w-[240px] truncate py-2.5 pr-4 font-medium text-foreground">
                                {viagem.motivo || "-"}
                              </td>
                              <td className="max-w-[240px] truncate py-2.5 pr-4 text-muted-foreground">
                                {buildTrechosLabel(viagem)}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-primary">
                                {formatCents(viagem.valorDiariasCents)}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-accent">
                                {formatCents(viagem.valorPassagensCents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {viagensTotalView > PAGE_SIZE ? (
                      <PaginationControls
                        total={viagensTotalView}
                        limit={PAGE_SIZE}
                        offset={viagensOffset}
                        onPageChange={setViagensOffset}
                        itemLabel="viagens"
                      />
                    ) : null}
                  </>
                )}
              </section>

              <section className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
                      <FileText className="h-4.5 w-4.5 text-primary" />
                      Emendas parlamentares
                    </h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Itens paginados com valores de empenho, liquidacao e pagamento.
                    </p>
                  </div>
                  <div className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    {formatCountCompact(emendasTotalView)} emendas
                  </div>
                </div>

                {emendasPage.length === 0 ? (
                  <EmptyState message="Nenhuma emenda registrada neste periodo." />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {emendasPage.map((emenda, index) => (
                        <MobileEmendaCard key={emenda.id || index} emenda={emenda} />
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[760px] text-xs">
                        <thead>
                          <tr className="border-b border-border/80 text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-semibold">Ano</th>
                            <th className="pb-2 pr-4 font-semibold">Tipo</th>
                            <th className="pb-2 pr-4 font-semibold">Codigo</th>
                            <th className="pb-2 pr-4 text-right font-semibold">Empenhado</th>
                            <th className="pb-2 pr-4 text-right font-semibold">Liquidado</th>
                            <th className="pb-2 text-right font-semibold">Pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {emendasPage.map((emenda, index) => (
                            <tr key={emenda.id || index} className="hover:bg-muted/35">
                              <td className="py-2.5 pr-4 font-semibold">
                                {emenda.anoEmenda || "-"}
                              </td>
                              <td className="py-2.5 pr-4 text-muted-foreground">
                                {emenda.tipoEmenda || "-"}
                              </td>
                              <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">
                                {emenda.codigoEmenda || "-"}
                              </td>
                              <td className="py-2.5 pr-4 text-right font-semibold text-muted-foreground">
                                {formatCents(emenda.valorEmpenhadoCents)}
                              </td>
                              <td className="py-2.5 pr-4 text-right font-semibold text-muted-foreground">
                                {formatCents(emenda.valorLiquidadoCents)}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-primary">
                                {formatCents(emenda.valorPagoCents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {emendasTotalView > PAGE_SIZE ? (
                      <PaginationControls
                        total={emendasTotalView}
                        limit={PAGE_SIZE}
                        offset={emendasOffset}
                        onPageChange={setEmendasOffset}
                        itemLabel="emendas"
                      />
                    ) : null}
                  </>
                )}
              </section>
                  {perfilExterno ? (
                  <PerfilExternoSection
                    perfil={perfilExterno}
                    lexmlLimit={LEXML_PAGE_SIZE}
                    lexmlOffset={lexmlOffset}
                    onLexmlPageChange={setLexmlOffset}
                  />
                  ) : isPerfilExternoLoading ? (
                    <Skeleton className="h-72 w-full rounded-[28px]" />
                  ) : null}
              </div>
            ) : null}
          </div>
        </main>
      </div>
  );
};

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: typeof Banknote;
}) => (
  <article className="rounded-[22px] border border-border/70 bg-card/85 p-4 shadow-card">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-3 text-xl font-extrabold leading-tight text-foreground sm:text-2xl">{value}</p>
    {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
  </article>
);

const SummaryRow = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background/80 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="sm:text-right">
      <span className="block font-semibold text-foreground">{value}</span>
      {helper ? <span className="block text-[10px] text-muted-foreground">{helper}</span> : null}
    </span>
  </div>
);

const ExternalSubcard = ({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
    <div className="mb-2 flex items-start justify-between gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      {helper ? <p className="text-[10px] text-muted-foreground">{helper}</p> : null}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const MobileViagemCard = ({ viagem }: { viagem: Viagem }) => (
  <article className="rounded-[22px] border border-border/70 bg-background/85 p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold leading-6 text-foreground">
          {viagem.motivo || viagem.destinos || "Viagem oficial"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-primary">
          {formatCentsCompact(buildViagemLiquidaCents(viagem))}
        </p>
        <p className="text-[11px] text-muted-foreground">total estimado</p>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
      {viagem.orgaoSolicitanteNome ? (
        <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
          {viagem.orgaoSolicitanteNome}
        </span>
      ) : null}
      {viagem.situacao ? (
        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
          {viagem.situacao}
        </span>
      ) : null}
    </div>

    <p className="mt-3 text-xs leading-5 text-muted-foreground">{buildTrechosLabel(viagem)}</p>

    <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
      <SummaryRow
        label="Diarias"
        value={formatCentsCompact(viagem.valorDiariasCents)}
        helper={formatCents(viagem.valorDiariasCents)}
      />
      <SummaryRow
        label="Passagens"
        value={formatCentsCompact(viagem.valorPassagensCents)}
        helper={formatCents(viagem.valorPassagensCents)}
      />
    </div>
  </article>
);

const MobileEmendaCard = ({ emenda }: { emenda: Emenda }) => (
  <article className="rounded-[22px] border border-border/70 bg-background/85 p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">
          {emenda.tipoEmenda || "Emenda parlamentar"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Ano {emenda.anoEmenda || "-"}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-primary">
          {formatCentsCompact(emenda.valorPagoCents)}
        </p>
        <p className="text-[11px] text-muted-foreground">pago</p>
      </div>
    </div>

    <p className="mt-3 break-all font-mono text-[10px] text-muted-foreground">
      {emenda.codigoEmenda || "-"}
    </p>

    <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
      <SummaryRow
        label="Empenhado"
        value={formatCentsCompact(emenda.valorEmpenhadoCents)}
        helper={formatCents(emenda.valorEmpenhadoCents)}
      />
      <SummaryRow
        label="Liquidado"
        value={formatCentsCompact(emenda.valorLiquidadoCents)}
        helper={formatCents(emenda.valorLiquidadoCents)}
      />
    </div>
  </article>
);

const DossieSkeleton = () => (
  <div className="space-y-6">
    <section className="rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-24 rounded-[24px]" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </section>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-[22px]" />
      ))}
    </section>
    <Skeleton className="h-72 w-full rounded-[28px]" />
    <Skeleton className="h-72 w-full rounded-[28px]" />
  </div>
);

const PerfilExternoSection = ({
  perfil,
  lexmlLimit,
  lexmlOffset,
  onLexmlPageChange,
}: {
  perfil: PerfilExterno;
  lexmlLimit: number;
  lexmlOffset: number;
  onLexmlPageChange: (offset: number) => void;
}) => {
  const lexmlDocs = perfil.lexml?.documentos ?? [];
  const lexmlTotal = perfil.lexml?.total ?? 0;
  const lexmlPageStart = lexmlDocs.length > 0 ? lexmlOffset + 1 : 0;
  const lexmlPageEnd = lexmlOffset + lexmlDocs.length;
  const lexmlHasPrevious = lexmlOffset > 0;
  const lexmlHasNext = lexmlOffset + lexmlDocs.length < lexmlTotal;

  const cards = [
    {
      key: "camara",
      icon: Building2,
      label: "Camara dos Deputados",
      visible: Boolean(perfil.camara?.nome),
      content: (
        <>
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-foreground">{perfil.camara?.nome}</p>
              {perfil.camara?.nomeCivil &&
              perfil.camara?.nomeCivil !== perfil.camara?.nome ? (
                <p>Nome civil: {perfil.camara.nomeCivil}</p>
              ) : null}
              {perfil.camara?.nomeEleitoral &&
              perfil.camara?.nomeEleitoral !== perfil.camara?.nome ? (
                <p>Nome eleitoral: {perfil.camara.nomeEleitoral}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              {perfil.camara?.siglaPartido || perfil.camara?.siglaUf ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  {[perfil.camara?.siglaPartido, perfil.camara?.siglaUf].filter(Boolean).join("/")}
                </span>
              ) : null}
              {perfil.camara?.situacao ? (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
                  {perfil.camara.situacao}
                </span>
              ) : null}
              {perfil.camara?.condicaoEleitoral ? (
                <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
                  {perfil.camara.condicaoEleitoral}
                </span>
              ) : null}
            </div>

            {perfil.camara?.idLegislatura ? (
              <p>Legislatura: {perfil.camara.idLegislatura}</p>
            ) : null}

            {perfil.camara?.dataStatus ? (
              <p>Atualizado em {formatDate(perfil.camara.dataStatus)}</p>
            ) : null}

            {perfil.camara?.descricaoStatus ? <p>{perfil.camara.descricaoStatus}</p> : null}

            {perfil.camara?.gabinete?.sala ||
            perfil.camara?.gabinete?.andar ||
            perfil.camara?.gabinete?.telefone ||
            perfil.camara?.gabinete?.email ? (
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Gabinete
                </p>
                <div className="mt-2 space-y-1.5">
                  {perfil.camara?.gabinete?.nome ? <p>{perfil.camara.gabinete.nome}</p> : null}
                  {perfil.camara?.gabinete?.sala ||
                  perfil.camara?.gabinete?.predio ||
                  perfil.camara?.gabinete?.andar ? (
                    <p>
                      {[
                        perfil.camara?.gabinete?.predio && `Predio ${perfil.camara.gabinete.predio}`,
                        perfil.camara?.gabinete?.andar && `${perfil.camara.gabinete.andar} andar`,
                        perfil.camara?.gabinete?.sala && `Sala ${perfil.camara.gabinete.sala}`,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  ) : null}
                  {perfil.camara?.gabinete?.telefone ? (
                    <p className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {perfil.camara.gabinete.telefone}
                    </p>
                  ) : null}
                  {perfil.camara?.gabinete?.email ? (
                    <p className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {perfil.camara.gabinete.email}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {perfil.camara?.escolaridade ? (
              <p className="inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {perfil.camara.escolaridade}
              </p>
            ) : null}

            {perfil.camara?.dataNascimento ? (
              <p className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(perfil.camara.dataNascimento)}
                {perfil.camara?.municipioNascimento || perfil.camara?.ufNascimento
                  ? ` | ${[perfil.camara?.municipioNascimento, perfil.camara?.ufNascimento].filter(Boolean).join("/")}`
                  : ""}
              </p>
            ) : null}

            {perfil.camara?.sexo ? <p>Sexo: {perfil.camara.sexo}</p> : null}

            {perfil.camara?.email ? (
              <p className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {perfil.camara.email}
              </p>
            ) : null}
            {perfil.camara?.urlWebsite ? (
              <a
                href={perfil.camara.urlWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Site oficial <LinkIcon className="h-3 w-3" />
              </a>
            ) : null}
            {perfil.camara?.redesSociais?.slice(0, 2).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-primary hover:underline"
              >
                {url}
              </a>
            ))}

            {perfil.camara?.despesasRecentes?.length ? (
              <ExternalSubcard
                title="Cota parlamentar recente"
                helper={`${perfil.camara?.despesasRecentesResumo?.totalItens ?? perfil.camara.despesasRecentes.length} registros recentes`}
              >
                {perfil.camara?.despesasRecentesResumo?.totalLiquidoCents ? (
                  <p className="text-[11px] font-semibold text-primary">
                    {formatCentsCompact(perfil.camara.despesasRecentesResumo.totalLiquidoCents)} liquidos no recorte recente
                  </p>
                ) : null}
                <div className="space-y-2">
                  {perfil.camara.despesasRecentes.slice(0, 3).map((despesa, index) => (
                    <div
                      key={`${despesa.dataDocumento || despesa.tipoDespesa || "despesa"}-${index}`}
                      className="rounded-xl border border-border/60 bg-card/70 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {despesa.tipoDespesa || "Despesa parlamentar"}
                          </p>
                          {despesa.nomeFornecedor ? (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {despesa.nomeFornecedor}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatCentsCompact(despesa.valorLiquidoCents)}
                          </p>
                          {despesa.dataDocumento ? (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(despesa.dataDocumento)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.mandatosExternos?.length ? (
              <ExternalSubcard title="Mandatos anteriores">
                <div className="space-y-2">
                  {perfil.camara.mandatosExternos.slice(0, 3).map((mandato, index) => (
                    <div key={`${mandato.cargo || "mandato"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {mandato.cargo || "Cargo eletivo"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[mandato.municipio, mandato.siglaUf].filter(Boolean).join("/")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[mandato.anoInicio, mandato.anoFim].filter(Boolean).join(" - ")}
                        {mandato.siglaPartidoEleicao ? ` | ${mandato.siglaPartidoEleicao}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.orgaos?.length || perfil.camara?.frentes?.length ? (
              <ExternalSubcard title="Atuacao institucional">
                <div className="space-y-2">
                  {perfil.camara?.orgaos?.slice(0, 3).map((orgao, index) => (
                    <div key={`${orgao.idOrgao || orgao.siglaOrgao || "orgao"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {orgao.titulo || "Membro"}{orgao.siglaOrgao ? ` - ${orgao.siglaOrgao}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {orgao.nomePublicacao || orgao.nomeOrgao}
                      </p>
                    </div>
                  ))}
                  {perfil.camara?.frentes?.slice(0, 2).map((frente, index) => (
                    <div key={`${frente.id || "frente"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <p className="font-semibold text-foreground">{frente.titulo}</p>
                      {frente.idLegislatura ? (
                        <p className="text-[11px] text-muted-foreground">Legislatura {frente.idLegislatura}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.profissoes?.length || perfil.camara?.ocupacoes?.length ? (
              <ExternalSubcard title="Profissoes e ocupacoes">
                <div className="flex flex-wrap gap-2">
                  {perfil.camara?.profissoes?.slice(0, 4).map((profissao, index) =>
                    profissao.titulo ? (
                      <span
                        key={`${profissao.titulo}-${index}`}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {profissao.titulo}
                      </span>
                    ) : null
                  )}
                </div>
                {perfil.camara?.ocupacoes?.slice(0, 2).map((ocupacao, index) => (
                  <div key={`${ocupacao.titulo || ocupacao.entidade || "ocupacao"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                    <p className="font-semibold text-foreground">
                      {ocupacao.titulo || ocupacao.entidade || "Ocupacao registrada"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[ocupacao.entidade, ocupacao.entidadeUf, ocupacao.entidadePais].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                ))}
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.historico?.length ? (
              <ExternalSubcard title="Historico recente">
                <div className="space-y-2">
                  {perfil.camara.historico.slice(0, 3).map((item, index) => (
                    <div key={`${item.dataHora || "historico"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {[item.situacao, item.condicaoEleitoral].filter(Boolean).join(" | ") || "Atualizacao parlamentar"}
                          </p>
                          {item.descricaoStatus ? (
                            <p className="line-clamp-2 text-[11px] text-muted-foreground">{item.descricaoStatus}</p>
                          ) : null}
                        </div>
                        {item.dataHora ? (
                          <p className="shrink-0 text-[10px] text-muted-foreground">{formatDate(item.dataHora)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.discursosRecentes?.length || perfil.camara?.eventosRecentes?.length ? (
              <ExternalSubcard title="Atividade recente na Camara">
                <div className="space-y-2">
                  {perfil.camara?.discursosRecentes?.slice(0, 2).map((discurso, index) => (
                    <div key={`${discurso.dataHoraInicio || "discurso"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {discurso.tipoDiscurso || "Discurso registrado"}
                      </p>
                      {discurso.sumario ? (
                        <p className="line-clamp-3 text-[11px] text-muted-foreground">{discurso.sumario}</p>
                      ) : null}
                    </div>
                  ))}
                  {perfil.camara?.eventosRecentes?.slice(0, 2).map((evento, index) => (
                    <div key={`${evento.id || evento.dataHoraInicio || "evento"}-${index}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {evento.descricao || evento.descricaoTipo || "Evento parlamentar"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[evento.situacao, evento.dataHoraInicio && formatDate(evento.dataHoraInicio)].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}
          </div>
          {perfil.camara?.uri ? (
            <a
              href={perfil.camara.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Acessar fonte <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </>
      ),
    },
    {
      key: "senado",
      icon: Scale,
      label: "Senado Federal",
      visible: Boolean(perfil.senado?.nome),
      content: (
        <>
          <p className="font-semibold text-foreground">{perfil.senado?.nome}</p>
          <p>
            {perfil.senado?.siglaPartido}/{perfil.senado?.uf}
          </p>
          {perfil.senado?.email ? (
            <p className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {perfil.senado.email}
            </p>
          ) : null}
          {perfil.senado?.urlPagina ? (
            <a
              href={perfil.senado.urlPagina}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Acessar fonte <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </>
      ),
    },
    {
      key: "tse",
      icon: FileText,
      label: "TSE",
      visible: Boolean(
        perfil.tse?.datasetCandidatosUrl ||
          perfil.tse?.datasetResultadosUrl ||
          perfil.tse?.divulgaCandContasUrl
      ),
      content: (
        <>
          <p className="font-semibold text-foreground">
            Referencias oficiais do TSE para consulta eleitoral
          </p>
          {perfil.tse?.termoBusca ? (
            <p className="text-[11px] text-muted-foreground">
              Baseado na busca por <strong className="text-foreground">{perfil.tse.termoBusca}</strong>
            </p>
          ) : null}

          <div className="space-y-2">
            {perfil.tse?.divulgaCandContasUrl ? (
              <a
                href={perfil.tse.divulgaCandContasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <span className="font-medium text-foreground">DivulgaCandContas</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </a>
            ) : null}
            {perfil.tse?.datasetCandidatosUrl ? (
              <a
                href={perfil.tse.datasetCandidatosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <span className="font-medium text-foreground">Dataset de candidatos</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </a>
            ) : null}
            {perfil.tse?.datasetResultadosUrl ? (
              <a
                href={perfil.tse.datasetResultadosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <span className="font-medium text-foreground">Dataset de resultados</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </a>
            ) : null}
          </div>
        </>
      ),
    },
    {
      key: "brasilio",
      icon: Database,
      label: "Brasil.IO",
      visible: Boolean((perfil.brasilIo?.total ?? 0) > 0),
      content: (
        <>
          <p className="font-semibold text-foreground">
            {perfil.brasilIo?.total ?? 0} candidaturas encontradas
          </p>
          {perfil.brasilIo?.candidatos?.slice(0, 3).map((candidato, index) => (
            <p key={index}>
              {candidato.anoEleicao} - {candidato.descricaoCargo} -{" "}
              {candidato.siglaPartido}
            </p>
          ))}
        </>
      ),
    },
    {
      key: "lexml",
      icon: Landmark,
      label: "LexML",
      visible: Boolean(lexmlTotal > 0),
      content: (
        <>
          <p className="font-semibold text-foreground">
            {lexmlTotal} documentos legislativos
          </p>
          <p className="text-[11px] text-muted-foreground">
            {lexmlPageStart > 0
              ? `${lexmlPageStart}-${lexmlPageEnd} de ${lexmlTotal.toLocaleString("pt-BR")} resultados`
              : "Nenhum documento nesta pagina"}
          </p>

          <div className="space-y-2">
            {lexmlDocs.map((doc, index) => (
              <a
                key={`${doc.url || doc.identificador || doc.titulo || "lexml"}-${index}`}
                href={doc.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-border/60 bg-card/70 px-3 py-2 transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <p className="line-clamp-2 font-semibold text-foreground">{doc.titulo}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {[doc.tipo, doc.data].filter(Boolean).join(" | ")}
                </p>
              </a>
            ))}
          </div>

          {lexmlTotal > lexmlLimit ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <button
                type="button"
                onClick={() => onLexmlPageChange(Math.max(0, lexmlOffset - lexmlLimit))}
                disabled={!lexmlHasPrevious}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <span className="text-[11px] font-medium text-muted-foreground">
                Pagina {Math.floor(lexmlOffset / lexmlLimit) + 1} de {Math.max(1, Math.ceil(lexmlTotal / lexmlLimit))}
              </span>

              <button
                type="button"
                onClick={() => onLexmlPageChange(lexmlOffset + lexmlLimit)}
                disabled={!lexmlHasNext}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Proxima
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: "wikipedia",
      icon: Globe,
      label: "Wikipedia",
      visible: Boolean(perfil.wikipedia?.resumo),
      content: (
        <>
          <p className="line-clamp-4">{perfil.wikipedia?.resumo}</p>
          {perfil.wikipedia?.url ? (
            <a
              href={perfil.wikipedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Ler artigo <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </>
      ),
    },
  ].filter((card) => card.visible);

  if (!cards.length) return null;

  return (
    <section className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Globe className="h-4.5 w-4.5 text-accent" />
        Perfil em fontes externas
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-[22px] border border-border/70 bg-background/85 p-4 text-xs leading-5 text-muted-foreground"
          >
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground">
              <card.icon className="h-4 w-4 text-primary" />
              {card.label}
            </h3>
            <div className="space-y-1.5">{card.content}</div>
          </article>
        ))}
      </div>
    </section>
  );
};

function buildTrechosLabel(viagem: Viagem) {
  const trechos =
    viagem.trechos?.nodes
      ?.map((trecho) => `${trecho.origemCidade || "-"} -> ${trecho.destinoCidade || "-"}`)
      .filter(Boolean) ?? [];

  if (trechos.length) {
    return trechos.join(" | ");
  }

  return viagem.destinos || "Sem rota detalhada";
}

function buildViagemLiquidaCents(viagem: Viagem) {
  const total =
    toBigInt(viagem.valorDiariasCents) +
    toBigInt(viagem.valorPassagensCents) +
    toBigInt(viagem.valorOutrosGastosCents) -
    toBigInt(viagem.valorDevolucaoCents);

  return total.toString();
}

function buildEmendasResumo(emendas: Emenda[]) {
  let totalEmpenhado = 0n;
  let totalLiquidado = 0n;
  let totalPago = 0n;
  let totalRecebidoFavorecidos = 0n;
  let totalFavorecidos = 0;

  for (const emenda of emendas) {
    totalEmpenhado += toBigInt(emenda.valorEmpenhadoCents);
    totalLiquidado += toBigInt(emenda.valorLiquidadoCents);
    totalPago += toBigInt(emenda.valorPagoCents);

    const favorecidos = emenda.favorecidos?.nodes || [];
    totalFavorecidos += favorecidos.length;
    for (const fav of favorecidos) {
      totalRecebidoFavorecidos += toBigInt(fav.valorRecebidoCents);
    }
  }

  return {
    totalEmpenhadoCents: totalEmpenhado.toString(),
    totalLiquidadoCents: totalLiquidado.toString(),
    totalPagoCents: totalPago.toString(),
    totalRecebidoFavorecidosCents: totalRecebidoFavorecidos.toString(),
    totalFavorecidos,
  };
}

export default PoliticoDetalhe;
