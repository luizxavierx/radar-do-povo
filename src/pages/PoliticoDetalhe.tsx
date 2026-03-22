import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  Database,
  ExternalLink,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Plane,
  FileText,
  Scale,
  User,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import AppFooter from "@/components/AppFooter";
import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { PoliticoNewsSection } from "@/components/politicos/PoliticoNewsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoliticoDossieCompleto, usePoliticoNoticias } from "@/hooks/usePoliticos";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  formatDate,
  toBigInt,
} from "@/lib/formatters";
import type { Emenda, PerfilExterno } from "@/api/types";

const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_END_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const pieColors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];

const PoliticoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [anoInicio, setAnoInicio] = useState(2019);
  const [anoFim, setAnoFim] = useState(DEFAULT_END_YEAR);
  const [viagensOffset, setViagensOffset] = useState(0);
  const [emendasOffset, setEmendasOffset] = useState(0);

  const nomeBusca = decodeURIComponent(id || "").trim();
  const { data: politico, isLoading, error } = usePoliticoDossieCompleto(nomeBusca, {
    anoInicio,
    anoFim,
    viagensLimit: PAGE_SIZE,
    viagensOffset,
    emendasLimit: PAGE_SIZE,
    emendasOffset,
    passagensLimit: 12,
    pagamentosLimit: 12,
    trechosLimit: 12,
    conveniosLimit: 12,
    favorecidosLimit: 12,
  });
  const nomePoliticoNoticias = politico
    ? politico.nomeCompleto || politico.nomeCanonico?.replace(/-/g, " ") || nomeBusca.replace(/-/g, " ")
    : "";
  const {
    data: noticias,
    isLoading: isNoticiasLoading,
    error: noticiasError,
    refetch: refetchNoticias,
  } = usePoliticoNoticias(nomePoliticoNoticias, 6);

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

  const fotoUrl =
    politico?.fotoUrl ||
    politico?.perfilExterno?.camara?.urlFoto ||
    politico?.perfilExterno?.senado?.urlFoto;

  const pieData = useMemo(() => {
    if (!gastos) return [];

    const source = [
      { name: "Diarias", value: centsToNumber(totalDiariasCents.toString()) },
      { name: "Passagens", value: centsToNumber(totalPassagensCents.toString()) },
      { name: "Outros", value: centsToNumber(totalOutrosGastosCents.toString()) },
    ];

    return source.filter((item) => item.value > 0);
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
              <section className="animate-fade-up rounded-3xl border border-white/60 bg-card/80 p-6 shadow-elevated backdrop-blur-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={politico.nomeCanonico}
                        className="h-24 w-24 rounded-2xl object-cover shadow-card"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-extrabold uppercase tracking-wide text-foreground sm:text-3xl">
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

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {politico.dataNascimento ? (
                          <span>Nascimento: {formatDate(politico.dataNascimento)}</span>
                        ) : null}
                        {politico.perfilExterno?.camara?.email ||
                        politico.perfilExterno?.senado?.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {politico.perfilExterno?.camara?.email ||
                              politico.perfilExterno?.senado?.email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-semibold shadow-card">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Inicio
                      <select
                        value={anoInicio}
                        onChange={(e) => handlePeriodChange(Number(e.target.value), anoFim)}
                        className="bg-transparent outline-none"
                      >
                        {years.map((year) => (
                          <option key={`start-${year}`} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-semibold shadow-card">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Fim
                      <select
                        value={anoFim}
                        onChange={(e) => handlePeriodChange(anoInicio, Number(e.target.value))}
                        className="bg-transparent outline-none"
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
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                  <h2 className="mb-3 text-base font-bold">
                    Composicao das viagens ({anoInicio}-{anoFim})
                  </h2>

                  {pieData.length === 0 ? (
                    <EmptyState message="Sem valores de gastos para este periodo." />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={92}
                              innerRadius={50}
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={pieColors[index % pieColors.length]}
                                />
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
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
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

              <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                  <Plane className="h-4.5 w-4.5 text-accent" />
                  Viagens
                </h2>

                {viagensPage.length === 0 ? (
                  <EmptyState message="Nenhuma viagem registrada neste periodo." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
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
                                {viagem.trechos?.nodes
                                  ?.map(
                                    (trecho) =>
                                      `${trecho.origemCidade} -> ${trecho.destinoCidade}`
                                  )
                                  .join(" | ") || "-"}
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
                      />
                    ) : null}
                  </>
                )}
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  Emendas parlamentares
                </h2>

                {emendasPage.length === 0 ? (
                  <EmptyState message="Nenhuma emenda registrada neste periodo." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
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
                      />
                    ) : null}
                  </>
                )}
              </section>

                {politico.perfilExterno ? (
                  <PerfilExternoSection perfil={politico.perfilExterno} />
                ) : null}
              </div>
            ) : null}
          </div>

          <AppFooter className="mt-10" />
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
  <article className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
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
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">
      <span className="block font-semibold text-foreground">{value}</span>
      {helper ? <span className="block text-[10px] text-muted-foreground">{helper}</span> : null}
    </span>
  </div>
);

const DossieSkeleton = () => (
  <div className="space-y-6">
    <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-card">
      <div className="flex items-start gap-4">
        <Skeleton className="h-24 w-24 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
    </section>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-2xl" />
      ))}
    </section>
    <Skeleton className="h-64 w-full rounded-2xl" />
    <Skeleton className="h-64 w-full rounded-2xl" />
  </div>
);

const PerfilExternoSection = ({ perfil }: { perfil: PerfilExterno }) => {
  const cards = [
    {
      key: "camara",
      icon: Building2,
      label: "Camara dos Deputados",
      visible: Boolean(perfil.camara?.nome),
      content: (
        <>
          <p className="font-semibold text-foreground">{perfil.camara?.nome}</p>
          <p>
            {perfil.camara?.siglaPartido}/{perfil.camara?.siglaUf}
          </p>
          {perfil.camara?.email ? (
            <p className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {perfil.camara.email}
            </p>
          ) : null}
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
      visible: Boolean((perfil.lexml?.total ?? 0) > 0),
      content: (
        <>
          <p className="font-semibold text-foreground">
            {perfil.lexml?.total ?? 0} documentos legislativos
          </p>
          {perfil.lexml?.documentos?.slice(0, 2).map((doc, index) => (
            <a
              key={index}
              href={doc.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-primary hover:underline"
            >
              {doc.titulo}
            </a>
          ))}
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
    <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Globe className="h-4.5 w-4.5 text-accent" />
        Perfil em fontes externas
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground"
          >
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground">
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
