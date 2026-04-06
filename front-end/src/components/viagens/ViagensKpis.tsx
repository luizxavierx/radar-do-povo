import { CreditCard, Plane, Route, Users, Wallet } from "lucide-react";

import type { ResumoViagens } from "@/api/types";
import { ErrorStateWithRetry } from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatCentsCompact, formatCountCompact, toBigInt } from "@/lib/formatters";

interface ViagensKpisProps {
  data?: ResumoViagens;
  isLoading: boolean;
  error?: Error | null;
  isComplementLoading?: boolean;
  onRetry: () => void;
}

function moneyValue(value?: string, isPending?: boolean) {
  if (value !== undefined) {
    return formatCentsCompact(value);
  }

  return isPending ? "..." : "R$ 0,00";
}

const ViagensKpis = ({
  data,
  isLoading,
  error,
  isComplementLoading = false,
  onRetry,
}: ViagensKpisProps) => {
  if (isLoading) {
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="h-[320px] rounded-[30px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-[24px]" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return <ErrorStateWithRetry error={error} onRetry={onRetry} />;
  }

  const gross = toBigInt(data?.totalGastoBrutoCents);
  const mix = [
    {
      label: "Diarias",
      value: data?.totalDiariasCents,
      color: "from-amber-400 via-orange-300 to-orange-200",
    },
    {
      label: "Passagens",
      value: data?.totalPassagensCents,
      color: "from-blue-500 via-cyan-400 to-sky-300",
    },
    {
      label: "Pagamentos",
      value: data?.totalPagamentosCents,
      color: "from-emerald-500 via-teal-400 to-cyan-300",
    },
    {
      label: "Outros",
      value: data?.totalOutrosGastosCents,
      color: "from-violet-500 via-fuchsia-400 to-pink-300",
    },
  ].map((item) => {
    const raw = toBigInt(item.value);
    const share = gross > 0n ? Number((raw * 10000n) / gross) / 100 : 0;

    return {
      ...item,
      raw,
      share,
    };
  });

  const secondaryCards = [
    {
      label: "Passagens",
      value: formatCentsCompact(data?.totalPassagensCents),
      helper: formatCents(data?.totalPassagensCents),
      icon: CreditCard,
      accent: "from-blue-500/20 via-cyan-400/10 to-transparent",
      iconTint: "bg-blue-500/10 text-blue-700",
    },
    {
      label: "Diarias",
      value: formatCentsCompact(data?.totalDiariasCents),
      helper: formatCents(data?.totalDiariasCents),
      icon: Route,
      accent: "from-amber-400/20 via-orange-300/10 to-transparent",
      iconTint: "bg-amber-500/10 text-amber-700",
    },
    {
      label: "Viagens",
      value: formatCountCompact(data?.totalViagens ?? 0),
      helper: `${(data?.totalViagens ?? 0).toLocaleString("pt-BR")} registros`,
      icon: Plane,
      accent: "from-emerald-400/20 via-cyan-300/10 to-transparent",
      iconTint: "bg-emerald-500/10 text-emerald-700",
    },
    {
      label: "Viajantes",
      value: formatCountCompact(data?.totalViajantes ?? 0),
      helper: `${(data?.totalViajantes ?? 0).toLocaleString("pt-BR")} pessoas`,
      icon: Users,
      accent: "from-violet-400/20 via-sky-300/10 to-transparent",
      iconTint: "bg-violet-500/10 text-violet-700",
    },
  ];

  const headlineMetrics = [
    {
      label: "Gasto bruto",
      value: moneyValue(data?.totalGastoBrutoCents, isComplementLoading),
      helper: "Base informada no recorte",
    },
    {
      label: "Ticket medio",
      value: moneyValue(data?.ticketMedioViagemCents, isComplementLoading),
      helper: "Media por viagem",
    },
    {
      label: "Devolucoes",
      value: moneyValue(data?.totalDevolucaoCents, isComplementLoading),
      helper: "Ajustes e retornos",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Leitura central
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-foreground">
          O que importa neste recorte
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Um resumo mais limpo para entender impacto financeiro, volume e distribuicao do gasto.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="editorial-panel-strong bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(245,248,250,0.94)_58%,rgba(232,245,243,0.82)_100%)] p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  <Wallet className="h-3.5 w-3.5" />
                  Gasto liquido
                </div>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  {formatCentsCompact(data?.totalGastoLiquidoCents)}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground/80">
                  {formatCents(data?.totalGastoLiquidoCents)}
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Valor final do periodo, ja considerando devolucoes e ajustes registrados nas
                  viagens.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-white/90 px-3 py-1 text-xs font-medium text-foreground">
                    {moneyValue(data?.gastoMedioViajanteCents, isComplementLoading)} por viajante
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-white/90 px-3 py-1 text-xs font-medium text-foreground">
                    {formatCountCompact(data?.totalViajantes ?? 0)} viajantes distintos
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[340px] xl:grid-cols-1">
                {headlineMetrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="surface-muted bg-white/94 p-3.5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-base font-bold tracking-tight text-foreground">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{metric.helper}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="surface-muted bg-white/92 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Composicao do gasto
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quanto cada frente pesa dentro do gasto bruto.
                  </p>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {formatCentsCompact(data?.totalGastoBrutoCents)}
                </p>
              </div>

              <div className="space-y-3">
                {mix.map((item) => {
                  const barWidth = item.raw > 0n ? Math.max(item.share, 5) : 0;

                  return (
                    <article key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCentsCompact(item.value)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.share.toLocaleString("pt-BR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 1,
                            })}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div
                          className={`h-2.5 rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {secondaryCards.map((card) => (
            <CompactMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              accent={card.accent}
              iconTint={card.iconTint}
              icon={card.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const CompactMetricCard = ({
  label,
  value,
  helper,
  accent,
  iconTint,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  accent: string;
  iconTint: string;
  icon: typeof Plane;
}) => (
  <article className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-white/95 p-4 shadow-card sm:p-5">
    <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-br ${accent}`} />
    <div className="relative flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <span className={`rounded-2xl p-2 shadow-sm ${iconTint}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
        {value}
      </p>
      {helper ? <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{helper}</p> : null}
    </div>
  </article>
);

export default ViagensKpis;
