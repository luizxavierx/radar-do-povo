import { Banknote, Building2, Layers3, TrendingUp, Users } from "lucide-react";

import type {
  Connection,
  ResumoViagens,
  ViagemOrgaoRanking,
  ViagemPessoaRanking,
} from "@/api/types";
import { ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopGastadoresCard from "@/components/viagens/TopGastadoresCard";
import TopOrgaosCard from "@/components/viagens/TopOrgaosCard";
import TopViajantesCard from "@/components/viagens/TopViajantesCard";
import { formatCents, formatCentsCompact, formatCountCompact, toBigInt } from "@/lib/formatters";

interface RankingState<T> {
  data?: Connection<T>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

interface ViagensAnalyticsDeckProps {
  summary?: ResumoViagens;
  summaryError?: Error | null;
  onRetrySummary: () => void;
  topGastadores: RankingState<ViagemPessoaRanking>;
  topViajantes: RankingState<ViagemPessoaRanking>;
  topOrgaosSuperiores: RankingState<ViagemOrgaoRanking>;
  topOrgaosSolicitantes: RankingState<ViagemOrgaoRanking>;
}

const ViagensAnalyticsDeck = ({
  summary,
  summaryError,
  onRetrySummary,
  topGastadores,
  topViajantes,
  topOrgaosSuperiores,
  topOrgaosSolicitantes,
}: ViagensAnalyticsDeckProps) => {
  const gross = toBigInt(summary?.totalGastoBrutoCents);
  const categories = [
    {
      label: "Diarias",
      icon: Users,
      value: summary?.totalDiariasCents,
      note: "Deslocamento e permanencia",
    },
    {
      label: "Passagens",
      icon: TrendingUp,
      value: summary?.totalPassagensCents,
      note: "Bilhetes e emissao",
    },
    {
      label: "Pagamentos",
      icon: Banknote,
      value: summary?.totalPagamentosCents,
      note: "Tabela complementar",
    },
    {
      label: "Outros gastos",
      icon: Layers3,
      value: summary?.totalOutrosGastosCents,
      note: "Despesas adicionais",
    },
  ].map((item) => {
    const raw = toBigInt(item.value);
    const share = gross > 0n ? Number((raw * 10000n) / gross) / 100 : 0;

    return {
      ...item,
      share,
    };
  });

  const insights = [
    {
      label: "Ticket medio por viagem",
      value: summary?.ticketMedioViagemCents
        ? formatCentsCompact(summary.ticketMedioViagemCents)
        : "R$ 0,00",
      helper: summary?.ticketMedioViagemCents
        ? formatCents(summary.ticketMedioViagemCents)
        : "Sem dado complementar",
    },
    {
      label: "Gasto medio por viajante",
      value: summary?.gastoMedioViajanteCents
        ? formatCentsCompact(summary.gastoMedioViajanteCents)
        : "R$ 0,00",
      helper: summary?.gastoMedioViajanteCents
        ? formatCents(summary.gastoMedioViajanteCents)
        : "Sem dado complementar",
    },
    {
      label: "Orgaos superiores",
      value: formatCountCompact(summary?.totalOrgaosSuperiores ?? 0),
      helper: `${(summary?.totalOrgaosSuperiores ?? 0).toLocaleString("pt-BR")} no recorte`,
    },
    {
      label: "Orgaos solicitantes",
      value: formatCountCompact(summary?.totalOrgaosSolicitantes ?? 0),
      helper: `${(summary?.totalOrgaosSolicitantes ?? 0).toLocaleString("pt-BR")} no recorte`,
    },
  ];

  return (
    <section
      id="viagens-analises"
      className="rounded-[32px] border border-border/75 bg-card/90 p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            Workspace analitico
          </p>
          <h2 className="mt-3 text-2xl font-extrabold text-foreground">
            Onde o gasto se concentrou e quem puxou o volume
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Uma leitura organizada para comparar pessoas, orgaos e composicao financeira sem
            fragmentar a atencao em cards estreitos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Gasto bruto
            </p>
            <p className="mt-2 text-base font-bold text-foreground">
              {formatCentsCompact(summary?.totalGastoBrutoCents)}
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Devolucoes
            </p>
            <p className="mt-2 text-base font-bold text-foreground">
              {formatCentsCompact(summary?.totalDevolucaoCents)}
            </p>
          </article>
        </div>
      </div>

      <Tabs defaultValue="pessoas" className="mt-6">
        <TabsList className="h-auto flex-wrap rounded-2xl border border-border/70 bg-background/70 p-1">
          <TabsTrigger
            value="pessoas"
            className="rounded-2xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-foreground"
          >
            Pessoas
          </TabsTrigger>
          <TabsTrigger
            value="orgaos"
            className="rounded-2xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-foreground"
          >
            Orgaos
          </TabsTrigger>
          <TabsTrigger
            value="composicao"
            className="rounded-2xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-foreground"
          >
            Composicao
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pessoas" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <TopGastadoresCard {...topGastadores} />
            <TopViajantesCard {...topViajantes} />
          </div>
        </TabsContent>

        <TabsContent value="orgaos" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <TopOrgaosCard
              title="Top orgaos superiores"
              description="Quem mais concentrou viagens pelo orgao superior"
              {...topOrgaosSuperiores}
            />
            <TopOrgaosCard
              title="Top orgaos solicitantes"
              description="Orgaos solicitantes com maior gasto liquido"
              {...topOrgaosSolicitantes}
            />
          </div>
        </TabsContent>

        <TabsContent value="composicao" className="mt-4">
          {summaryError ? <ErrorStateWithRetry error={summaryError} onRetry={onRetrySummary} /> : null}

          {!summary && !summaryError ? <LoadingState message="Carregando composicao financeira..." /> : null}

          {summary ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <section className="rounded-[30px] border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Financeiro
                    </p>
                    <h3 className="text-lg font-bold text-foreground">Composicao do gasto</h3>
                    <p className="text-sm text-muted-foreground">
                      Quanto cada componente pesa dentro do gasto bruto do recorte.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {categories.map((item) => (
                    <article key={item.label} className="rounded-[24px] border border-border/70 bg-background/90 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {formatCentsCompact(item.value)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{formatCents(item.value)}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary via-cyan-500 to-sky-400"
                            style={{ width: `${Math.max(item.share, 4)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {item.share.toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          })}
                          % do gasto bruto
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Leitura rapida
                    </p>
                    <h3 className="text-lg font-bold text-foreground">Indicadores derivados</h3>
                    <p className="text-sm text-muted-foreground">
                      Sinais para leitura executiva e comparativa do recorte atual.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {insights.map((item) => (
                    <article
                      key={item.label}
                      className="rounded-[24px] border border-border/70 bg-background/90 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-3 text-lg font-bold text-foreground">{item.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{item.helper}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-4 rounded-[24px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Leitura editorial
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Use esta aba para entender rapidamente se o recorte esta mais pressionado por
                    passagens, diarias ou pagamentos complementares. Isso ajuda a explicar por que
                    dois periodos com o mesmo volume de viagens podem ter custos muito diferentes.
                  </p>
                </div>
              </section>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default ViagensAnalyticsDeck;
