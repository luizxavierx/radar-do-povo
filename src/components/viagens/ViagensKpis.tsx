import {
  ArrowDownCircle,
  Banknote,
  CreditCard,
  Plane,
  Route,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import type { ResumoViagens } from "@/api/types";
import { ErrorStateWithRetry } from "@/components/StateViews";
import StatsCard from "@/components/StatsCard";
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

function countValue(value?: number, isPending?: boolean) {
  if (value !== undefined) {
    return formatCountCompact(value);
  }

  return isPending ? "..." : "0";
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
        <Skeleton className="h-[340px] rounded-[30px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-[28px]" />
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
      share,
    };
  });

  const secondaryCards = [
    {
      label: "Viagens",
      value: formatCountCompact(data?.totalViagens ?? 0),
      helper: `${(data?.totalViagens ?? 0).toLocaleString("pt-BR")} processos`,
      description: "Volume total no recorte",
      icon: Plane,
      variant: "yellow" as const,
    },
    {
      label: "Viajantes",
      value: formatCountCompact(data?.totalViajantes ?? 0),
      helper: `${(data?.totalViajantes ?? 0).toLocaleString("pt-BR")} pessoas`,
      description: "Chave distinta por CPF ou nome",
      icon: Users,
      variant: "blue" as const,
    },
    {
      label: "Passagens",
      value: formatCentsCompact(data?.totalPassagensCents),
      helper: formatCents(data?.totalPassagensCents),
      description: "Valor informado nas viagens",
      icon: CreditCard,
      variant: "blue" as const,
    },
    {
      label: "Diarias",
      value: formatCentsCompact(data?.totalDiariasCents),
      helper: formatCents(data?.totalDiariasCents),
      description: "Hospedagem e permanencia",
      icon: Route,
      variant: "yellow" as const,
    },
    {
      label: "Trechos",
      value: countValue(data?.totalTrechos, isComplementLoading),
      helper:
        data?.totalTrechos !== undefined
          ? data.totalTrechos.toLocaleString("pt-BR")
          : "Complemento carregando",
      description: "Tabela complementar de trechos",
      icon: TrendingUp,
      variant: "green" as const,
    },
    {
      label: "Devolucoes",
      value: moneyValue(data?.totalDevolucaoCents, isComplementLoading),
      helper:
        data?.totalDevolucaoCents !== undefined
          ? formatCents(data.totalDevolucaoCents)
          : "Complemento carregando",
      description: "Valores devolvidos ao erario",
      icon: ArrowDownCircle,
      variant: "green" as const,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Resumo executivo
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-foreground">
          O que importa primeiro no recorte atual
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Valores centrais do recorte atual.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[32px] border border-primary/15 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-4 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Wallet className="h-3.5 w-3.5" />
                KPI principal
              </p>
              <h3 className="mt-3 text-lg font-bold text-foreground">Gasto liquido consolidado</h3>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                {formatCentsCompact(data?.totalGastoLiquidoCents)}
              </p>
              <p className="mt-2 text-xs font-medium text-foreground/80 sm:text-sm">
                {formatCents(data?.totalGastoLiquidoCents)}
              </p>
              <p className="mt-3 max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                Referencia central do recorte depois de devolucoes e ajustes.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[320px]">
              <article className="rounded-[24px] border border-border/70 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ticket medio
                </p>
                <p className="mt-2 text-base font-bold text-foreground">
                  {moneyValue(data?.ticketMedioViagemCents, isComplementLoading)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Por viagem no recorte
                </p>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Gasto por viajante
                </p>
                <p className="mt-2 text-base font-bold text-foreground">
                  {moneyValue(data?.gastoMedioViajanteCents, isComplementLoading)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Media por pessoa no recorte
                </p>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-white/90 p-4 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Gasto bruto e devolucoes
                </p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {formatCentsCompact(data?.totalGastoBrutoCents)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">gasto bruto</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {moneyValue(data?.totalDevolucaoCents, isComplementLoading)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">devolucoes</p>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-border/70 bg-white/85 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Composicao financeira
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quanto cada componente pesa dentro do gasto bruto.
                </p>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {formatCentsCompact(data?.totalGastoBrutoCents)}
              </p>
            </div>

            <div className="space-y-4">
              {mix.map((item) => (
                <article key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCentsCompact(item.value)}</p>
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
                      style={{ width: `${Math.max(item.share, 4)}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {secondaryCards.map((card) => (
            <StatsCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              description={card.description}
              icon={card.icon}
              variant={card.variant}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ViagensKpis;
