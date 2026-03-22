import { Crown, Plane } from "lucide-react";

import type { Connection, ViagemPessoaRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { formatCents, formatCentsCompact, formatCountCompact } from "@/lib/formatters";
import { filterVisibleTravelerRankings } from "@/lib/viagens";

interface TopViajantesCardProps {
  data?: Connection<ViagemPessoaRanking>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

const TopViajantesCard = ({ data, isLoading, error, onRetry }: TopViajantesCardProps) => {
  const allNodes = data?.nodes ?? [];
  const visibleNodes = filterVisibleTravelerRankings(allNodes);
  const hiddenCount = allNodes.length - visibleNodes.length;
  const nodesToShow = visibleNodes.slice(0, 5);
  const maxTrips = Math.max(...nodesToShow.map((item) => item.totalViagens ?? 0), 1);
  const leader = nodesToShow[0];

  return (
    <section className="rounded-[30px] border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pessoas
            </p>
            <h3 className="text-lg font-bold text-foreground">Top viajantes</h3>
            <p className="text-sm text-muted-foreground">
              Quem mais apareceu nos deslocamentos do recorte atual.
            </p>
          </div>
        </div>

        {hiddenCount > 0 ? (
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {hiddenCount.toLocaleString("pt-BR")} ocultos
          </span>
        ) : null}
      </div>

      {isLoading ? <LoadingState message="Carregando ranking de viajantes..." /> : null}
      {error ? <ErrorStateWithRetry error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && !nodesToShow.length ? (
        <EmptyState
          message={
            allNodes.length
              ? "A API retornou apenas registros anonimizados ou sob sigilo para este recorte."
              : "Nenhum viajante retornado para este recorte."
          }
        />
      ) : null}

      {!isLoading && !error && leader ? (
        <div className="rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/8 via-white to-cyan-50 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Lider do recorte
              </p>
              <h4 className="mt-2 text-lg font-bold text-foreground">{leader.nomeViajante || "-"}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {leader.cargo || leader.funcao || "Cargo nao informado"}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold text-primary">
              <Crown className="h-3.5 w-3.5" />
              #1
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Viagens
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCountCompact(leader.totalViagens ?? 0)}
              </p>
            </article>
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
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatCents(leader.totalGastoLiquidoCents)}
              </p>
            </article>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && nodesToShow.length ? (
        <div className="mt-4 space-y-3">
          {nodesToShow.map((item, index) => {
            const trips = item.totalViagens ?? 0;
            const width = `${Math.max((trips / maxTrips) * 100, 8)}%`;

            return (
              <article
                key={`${item.cpfViajante || item.nomeViajante}-${index}`}
                className="rounded-[24px] border border-border/70 bg-background/90 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-bold text-foreground">
                        {item.nomeViajante || "-"}
                      </p>
                    </div>
                    <p className="mt-1 pl-9 text-xs text-muted-foreground">
                      {item.cargo || item.funcao || "Cargo nao informado"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCountCompact(trips)}</p>
                    <p className="text-[11px] text-muted-foreground">viagens</p>
                  </div>
                </div>

                <div className="mt-3 pl-9">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary via-cyan-500 to-sky-400"
                      style={{ width }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      gasto liquido {formatCentsCompact(item.totalGastoLiquidoCents)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCents(item.totalGastoLiquidoCents)}
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

export default TopViajantesCard;
