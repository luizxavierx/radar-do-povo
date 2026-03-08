import { useEffect, useMemo, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePoliticoDetalhe,
  usePoliticoPerfilExterno,
} from "@/hooks/usePoliticos";
import { useViagens } from "@/hooks/useViagens";
import { useEmendas, usePoliticoResumoFinanceiro } from "@/hooks/useEmendas";
import { graphqlRequest } from "@/api/graphqlClient";
import { EMENDAS_POLITICO_QUERY, VIAGENS_POLITICO_QUERY } from "@/api/queries";
import { centsToNumber, formatCents, formatDate, toBigInt } from "@/lib/formatters";
import type { Connection, Emenda, PerfilExterno, Viagem } from "@/api/types";

const PAGE_SIZE = 10;
const years = Array.from({ length: 8 }, (_, i) => 2026 - i);
const pieColors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];

const PoliticoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [anoInicio, setAnoInicio] = useState(2019);
  const [anoFim, setAnoFim] = useState(2025);
  const [viagensOffset, setViagensOffset] = useState(0);
  const [emendasOffset, setEmendasOffset] = useState(0);
  const queryClient = useQueryClient();

  const { data: politico, isLoading, error } = usePoliticoDetalhe({ id });
  const perfilExternoQuery = usePoliticoPerfilExterno(id, {
    camara: true,
    senado: true,
    lexml: true,
    brasilIo: true,
    wikipedia: true,
    tse: false,
  });
  const resumoFinanceiroQuery = usePoliticoResumoFinanceiro(id, { anoInicio, anoFim });
  const { data: viagens, isLoading: loadingViagens, error: viagensError } = useViagens(
    id,
    { limit: PAGE_SIZE, offset: viagensOffset },
    anoInicio,
    anoFim
  );
  const { data: emendas, isLoading: loadingEmendas, error: emendasError } = useEmendas(
    id,
    { limit: PAGE_SIZE, offset: emendasOffset },
    { anoInicio, anoFim }
  );

  const gastos = resumoFinanceiroQuery.data?.gastos;
  const emendasResumo = resumoFinanceiroQuery.data?.emendasResumo;
  const loadingResumo = resumoFinanceiroQuery.isLoading;
  const loadingGastos = resumoFinanceiroQuery.isLoading;
  const resumoError = resumoFinanceiroQuery.error as Error | null;

  const fotoUrl =
    politico?.fotoUrl || perfilExternoQuery.data?.camara?.urlFoto || perfilExternoQuery.data?.senado?.urlFoto;

  const pieData = useMemo(() => {
    if (!gastos) return [];

    const source = [
      { name: "Diarias", value: centsToNumber(gastos.totalDiariasCents) },
      { name: "Passagens", value: centsToNumber(gastos.totalPassagensCents) },
      { name: "Pagamentos", value: centsToNumber(gastos.totalPagamentosCents) },
      { name: "Outros", value: centsToNumber(gastos.totalOutrosGastosCents) },
    ];

    return source.filter((item) => item.value > 0);
  }, [gastos]);

  const totalGastos = useMemo(() => {
    if (!gastos) return "R$ 0,00";
    const total =
      toBigInt(gastos.totalDiariasCents) +
      toBigInt(gastos.totalPassagensCents) +
      toBigInt(gastos.totalPagamentosCents) +
      toBigInt(gastos.totalOutrosGastosCents);

    return formatCents(total.toString());
  }, [gastos]);

  const handlePeriodChange = (start: number, end: number) => {
    if (start > end) return;
    setAnoInicio(start);
    setAnoFim(end);
    setViagensOffset(0);
    setEmendasOffset(0);
  };

  useEffect(() => {
    if (!id || !viagens) return;

    const nextOffset = viagensOffset + PAGE_SIZE;
    if (nextOffset >= viagens.total) return;

    queryClient.prefetchQuery({
      queryKey: ["viagens-politico", id, { limit: PAGE_SIZE, offset: nextOffset }, anoInicio, anoFim],
      queryFn: ({ signal }) =>
        graphqlRequest<{ viagensPolitico: Connection<Viagem> }>(
          VIAGENS_POLITICO_QUERY,
          {
            input: { politicoId: id, anoInicio, anoFim },
            pagination: { limit: PAGE_SIZE, offset: nextOffset },
          },
          { signal }
        ).then((d) => d.viagensPolitico),
      staleTime: 60_000,
    });
  }, [anoFim, anoInicio, id, queryClient, viagens, viagensOffset]);

  useEffect(() => {
    if (!id || !emendas) return;

    const nextOffset = emendasOffset + PAGE_SIZE;
    if (nextOffset >= emendas.total) return;

    queryClient.prefetchQuery({
      queryKey: ["emendas-politico", id, { limit: PAGE_SIZE, offset: nextOffset }, { anoInicio, anoFim }],
      queryFn: ({ signal }) =>
        graphqlRequest<{ emendasPolitico: Connection<Emenda> }>(
          EMENDAS_POLITICO_QUERY,
          {
            input: { politicoId: id, filtro: { anoInicio, anoFim } },
            pagination: { limit: PAGE_SIZE, offset: nextOffset },
          },
          { signal }
        ).then((d) => d.emendasPolitico),
      staleTime: 60_000,
    });
  }, [anoFim, anoInicio, emendas, emendasOffset, id, queryClient]);

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

          {isLoading ? <LoadingState message="Carregando perfil do politico..." /> : null}
          {error ? <ErrorState error={error as Error} /> : null}
          {!isLoading && !error && !politico ? <EmptyState message="Politico nao encontrado." /> : null}

          {politico ? (
            <div className="space-y-6">
              <section className="animate-fade-up rounded-3xl border border-white/60 bg-card/80 p-6 shadow-elevated backdrop-blur-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={politico.nomeCanonico} className="h-24 w-24 rounded-2xl object-cover shadow-card" />
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
                        {politico.dataNascimento ? <span>Nascimento: {formatDate(politico.dataNascimento)}</span> : null}
                        {perfilExternoQuery.data?.camara?.email || perfilExternoQuery.data?.senado?.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {perfilExternoQuery.data?.camara?.email || perfilExternoQuery.data?.senado?.email}
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

              {loadingResumo ? <MetricsSkeleton /> : null}
              {!loadingResumo ? (
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Total gastos" value={totalGastos} icon={Banknote} />
                  <MetricCard label="Total viagens" value={String(gastos?.totalViagens ?? 0)} icon={Plane} />
                  <MetricCard label="Total emendas" value={String(emendasResumo?.totalEmendas ?? 0)} icon={FileText} />
                  <MetricCard label="Pago em emendas" value={formatCents(emendasResumo?.totalPagoCents)} icon={Landmark} />
                </section>
              ) : null}
              {resumoError ? <ErrorState error={resumoError} /> : null}

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                  <h2 className="mb-3 text-base font-bold">Composicao dos gastos ({anoInicio}-{anoFim})</h2>

                  {loadingGastos ? <PieBlockSkeleton /> : null}
                  {!loadingGastos && !resumoError && pieData.length === 0 ? (
                    <EmptyState message="Sem valores de gastos para este periodo." />
                  ) : null}

                  {pieData.length ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} innerRadius={50}>
                            {pieData.map((entry, index) => (
                              <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
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
                  ) : null}
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-bold">Resumo de emendas</h2>
                    {loadingResumo ? <ResumoEmendasSkeleton /> : null}
                    {!loadingResumo && !resumoError ? (
                      <div className="space-y-2 text-xs">
                        <SummaryRow label="Empenhado" value={formatCents(emendasResumo?.totalEmpenhadoCents)} />
                        <SummaryRow label="Liquidado" value={formatCents(emendasResumo?.totalLiquidadoCents)} />
                        <SummaryRow label="Pago" value={formatCents(emendasResumo?.totalPagoCents)} />
                        <SummaryRow
                          label="Favorecidos"
                          value={String(emendasResumo?.totalFavorecidos ?? 0)}
                        />
                        <SummaryRow
                          label="Recebido por favorecidos"
                          value={formatCents(emendasResumo?.totalRecebidoFavorecidosCents)}
                        />
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-bold">Periodo ativo</h2>
                    <p className="text-xs text-muted-foreground">
                      Este painel esta consultando a API entre <strong className="text-foreground">{anoInicio}</strong> e <strong className="text-foreground">{anoFim}</strong>.
                    </p>
                  </section>
                </div>
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                  <Plane className="h-4.5 w-4.5 text-accent" />
                  Viagens
                </h2>

                {loadingViagens ? <TableSkeleton rows={5} /> : null}
                {viagensError ? <ErrorState error={viagensError as Error} /> : null}
                {!loadingViagens && !viagensError && (!viagens || viagens.total === 0) ? (
                  <EmptyState message="Nenhuma viagem registrada neste periodo." />
                ) : null}

                {viagens?.nodes?.length ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs">
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
                          {viagens.nodes.map((viagem, index) => (
                            <tr key={viagem.processoId || index} className="hover:bg-muted/35">
                              <td className="py-2.5 pr-4 text-muted-foreground">
                                {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
                              </td>
                              <td className="max-w-[240px] truncate py-2.5 pr-4 font-medium text-foreground">
                                {viagem.motivo || "-"}
                              </td>
                              <td className="max-w-[220px] truncate py-2.5 pr-4 text-muted-foreground">
                                {viagem.trechos?.nodes?.map((trecho) => `${trecho.origemCidade} -> ${trecho.destinoCidade}`).join(" | ") || "-"}
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

                    <PaginationControls
                      total={viagens.total}
                      limit={viagens.limit}
                      offset={viagens.offset}
                      onPageChange={setViagensOffset}
                    />
                  </>
                ) : null}
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  Emendas parlamentares
                </h2>

                {loadingEmendas ? <TableSkeleton rows={5} /> : null}
                {emendasError ? <ErrorState error={emendasError as Error} /> : null}
                {!loadingEmendas && !emendasError && (!emendas || emendas.total === 0) ? (
                  <EmptyState message="Nenhuma emenda registrada neste periodo." />
                ) : null}

                {emendas?.nodes?.length ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-xs">
                        <thead>
                          <tr className="border-b border-border/80 text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-semibold">Ano</th>
                            <th className="pb-2 pr-4 font-semibold">Tipo</th>
                            <th className="pb-2 pr-4 font-semibold">Codigo</th>
                            <th className="pb-2 text-right font-semibold">Valor pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {emendas.nodes.map((emenda, index) => (
                            <tr key={emenda.id || index} className="hover:bg-muted/35">
                              <td className="py-2.5 pr-4 font-semibold">{emenda.anoEmenda || "-"}</td>
                              <td className="py-2.5 pr-4 text-muted-foreground">{emenda.tipoEmenda || "-"}</td>
                              <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{emenda.codigoEmenda || "-"}</td>
                              <td className="py-2.5 text-right font-semibold text-primary">{formatCents(emenda.valorPagoCents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <PaginationControls
                      total={emendas.total}
                      limit={emendas.limit}
                      offset={emendas.offset}
                      onPageChange={setEmendasOffset}
                    />
                  </>
                ) : null}
              </section>

              {perfilExternoQuery.isLoading ? <PerfilExternoSkeleton /> : null}
              {perfilExternoQuery.error ? <ErrorState error={perfilExternoQuery.error as Error} /> : null}
              {perfilExternoQuery.data ? <PerfilExternoSection perfil={perfilExternoQuery.data} /> : null}
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
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
}) => (
  <article className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
  </article>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/80 px-3 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

const MetricsSkeleton = () => (
  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <article key={index} className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-28" />
      </article>
    ))}
  </section>
);

const PieBlockSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-52" />
    <Skeleton className="h-64 w-full rounded-2xl" />
  </div>
);

const ResumoEmendasSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={index} className="h-9 w-full rounded-lg" />
    ))}
  </div>
);

const TableSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    <Skeleton className="h-8 w-full rounded-lg" />
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full rounded-lg" />
    ))}
  </div>
);

const PerfilExternoSkeleton = () => (
  <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
    <Skeleton className="mb-4 h-5 w-56" />
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  </section>
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
          <p>{perfil.camara?.siglaPartido}/{perfil.camara?.siglaUf}</p>
          {perfil.camara?.email ? <p className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{perfil.camara.email}</p> : null}
          {perfil.camara?.uri ? (
            <a href={perfil.camara.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
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
          <p>{perfil.senado?.siglaPartido}/{perfil.senado?.uf}</p>
          {perfil.senado?.email ? <p className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{perfil.senado.email}</p> : null}
          {perfil.senado?.urlPagina ? (
            <a href={perfil.senado.urlPagina} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
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
          <p className="font-semibold text-foreground">{perfil.brasilIo?.total ?? 0} candidaturas encontradas</p>
          {perfil.brasilIo?.candidatos?.slice(0, 3).map((candidato, index) => (
            <p key={index}>
              {candidato.anoEleicao} - {candidato.descricaoCargo} - {candidato.siglaPartido}
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
          <p className="font-semibold text-foreground">{perfil.lexml?.total ?? 0} documentos legislativos</p>
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
            <a href={perfil.wikipedia.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
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
          <article key={card.key} className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
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

export default PoliticoDetalhe;
