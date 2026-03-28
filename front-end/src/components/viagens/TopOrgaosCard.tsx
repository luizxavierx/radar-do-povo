import { Building2, Landmark } from "lucide-react";

import type { Connection, ViagemOrgaoRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { centsToNumber, formatCents, formatCentsCompact, formatCountCompact } from "@/lib/formatters";

interface TopOrgaosCardProps {
  title: string;
  description: string;
  data?: Connection<ViagemOrgaoRanking>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

const TopOrgaosCard = ({
  title,
  description,
  data,
  isLoading,
  error,
  onRetry,
}: TopOrgaosCardProps) => {
  const nodes = data?.nodes.slice(0, 5) ?? [];
  const leader = nodes[0];
  const maxValue = Math.max(...nodes.map((item) => centsToNumber(item.totalGastoLiquidoCents)), 1);

  return (
    <section className="min-w-0 overflow-hidden rounded-[30px] border border-border/75 bg-card/88 p-4 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Orgaos
          </p>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>

      {isLoading ? <LoadingState message={`Carregando ${title.toLowerCase()}...`} /> : null}
      {error ? <ErrorStateWithRetry error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && !nodes.length ? (
        <EmptyState message="Nenhum orgao retornado para este recorte." />
      ) : null}

      {!isLoading && !error && leader ? (
        <div className="overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/8 via-white to-cyan-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-2 text-primary shadow-sm">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Maior concentracao
              </p>
              <h4 className="mt-2 break-words text-base font-bold text-foreground sm:text-lg">{leader.nomeOrgao || "-"}</h4>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                codigo {leader.codigoOrgao || "-"} |{" "}
                {formatCountCompact(leader.totalViagens ?? 0)} viagens
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Gasto liquido
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCentsCompact(leader.totalGastoLiquidoCents)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Valor exato
              </p>
              <p className="mt-2 break-words text-xs font-semibold text-foreground sm:text-sm">
                {formatCents(leader.totalGastoLiquidoCents)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Viajantes
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCountCompact(leader.totalViajantes ?? 0)}
              </p>
            </article>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && nodes.length ? (
        <div className="mt-4 space-y-3">
          {nodes.map((item, index) => {
            const value = centsToNumber(item.totalGastoLiquidoCents);
            const width = `${Math.max((value / maxValue) * 100, 8)}%`;

            return (
              <article
                key={`${item.codigoOrgao || item.nomeOrgao}-${index}`}
                className="min-w-0 overflow-hidden rounded-[24px] border border-border/70 bg-background/90 p-3 sm:p-4"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-bold text-foreground">
                        {item.nomeOrgao || "-"}
                      </p>
                    </div>
                    <p className="mt-1 pl-9 text-xs text-muted-foreground">
                      codigo {item.codigoOrgao || "-"} |{" "}
                      {formatCountCompact(item.totalViajantes ?? 0)} viajantes
                    </p>
                  </div>

                  <div className="min-w-0 max-w-[110px] text-right sm:max-w-[150px]">
                    <p className="text-sm font-bold text-foreground">
                      {formatCentsCompact(item.totalGastoLiquidoCents)}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                      {formatCents(item.totalGastoLiquidoCents)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pl-0 sm:pl-9">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary via-cyan-500 to-sky-400"
                      style={{ width }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
                    <span className="text-muted-foreground">
                      {formatCountCompact(item.totalViagens ?? 0)} viagens
                    </span>
                    <span className="text-muted-foreground">
                      {formatCountCompact(item.totalTrechos ?? 0)} trechos
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default TopOrgaosCard;
