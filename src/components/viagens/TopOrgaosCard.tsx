import { Building2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import type { Connection, ViagemOrgaoRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { centsToNumber, formatCents, formatCentsCompact } from "@/lib/formatters";

interface TopOrgaosCardProps {
  title: string;
  description: string;
  data?: Connection<ViagemOrgaoRanking>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

const chartPalette = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444", "#7c3aed"];

const TopOrgaosCard = ({
  title,
  description,
  data,
  isLoading,
  error,
  onRetry,
}: TopOrgaosCardProps) => {
  const chartNodes = data?.nodes.slice(0, 5) ?? [];
  const chartData = chartNodes.map((item, index) => ({
    name: item.nomeOrgao || `Orgao ${index + 1}`,
    value: centsToNumber(item.totalGastoLiquidoCents),
    color: chartPalette[index % chartPalette.length],
    viagens: item.totalViagens ?? 0,
    codigo: item.codigoOrgao || "-",
    bruto: formatCents(item.totalGastoLiquidoCents),
    compacto: formatCentsCompact(item.totalGastoLiquidoCents),
  }));

  return (
    <section className="rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {isLoading ? <LoadingState message={`Carregando ${title.toLowerCase()}...`} /> : null}
      {error ? <ErrorStateWithRetry error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && !data?.nodes.length ? (
        <EmptyState message="Nenhum orgao retornado para este recorte." />
      ) : null}

      {!isLoading && !error && chartData.length ? (
        <div className="mb-4 rounded-2xl border border-border/70 bg-background/85 p-3">
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Distribuicao por gasto
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Leitura visual dos 5 orgaos com maior gasto liquido.
            </p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  innerRadius={42}
                  paddingAngle={3}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, _name, payload) => {
                    const item = payload?.payload as
                      | { bruto?: string; viagens?: number }
                      | undefined;
                    return [item?.bruto || value, `${item?.viagens || 0} viagens`];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {chartData.map((item) => (
              <div
                key={`${item.codigo}-${item.name}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Codigo {item.codigo} | {item.viagens.toLocaleString("pt-BR")} viagens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-primary">{item.compacto}</p>
                  <p className="text-[10px] text-muted-foreground">{item.bruto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {data?.nodes.slice(0, 5).map((item, index) => (
          <article
            key={`${item.codigoOrgao || item.nomeOrgao}-${index}`}
            className="rounded-2xl border border-border/70 bg-background/90 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
                  {item.nomeOrgao || "-"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Codigo {item.codigoOrgao || "-"}
                </p>
              </div>
              <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground">
                #{index + 1}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {(item.totalViagens ?? 0).toLocaleString("pt-BR")} viagens
              </span>
              <div className="text-right">
                <span className="block font-semibold text-primary">
                  {formatCentsCompact(item.totalGastoLiquidoCents)}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {formatCents(item.totalGastoLiquidoCents)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TopOrgaosCard;
