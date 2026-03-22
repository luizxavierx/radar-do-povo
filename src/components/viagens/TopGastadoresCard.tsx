import { Banknote, Medal } from "lucide-react";

import type { Connection, ViagemPessoaRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { centsToNumber, formatCents, formatCentsCompact, formatCountCompact } from "@/lib/formatters";
import { filterVisibleTravelerRankings } from "@/lib/viagens";

interface TopGastadoresCardProps {
  data?: Connection<ViagemPessoaRanking>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

const TopGastadoresCard = ({ data, isLoading, error, onRetry }: TopGastadoresCardProps) => {
  const allNodes = data?.nodes ?? [];
  const visibleNodes = filterVisibleTravelerRankings(allNodes);
  const hiddenCount = allNodes.length - visibleNodes.length;
  const nodesToShow = visibleNodes.slice(0, 5);
  const maxValue = Math.max(
    ...nodesToShow.map((item) => centsToNumber(item.totalGastoLiquidoCents)),
    1
  );
  const leader = nodesToShow[0];

  return (
    <section className="min-w-0 overflow-hidden rounded-[30px] border border-border/75 bg-card/88 p-4 shadow-card sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pessoas
            </p>
            <h3 className="text-lg font-bold text-foreground">Top gastadores</h3>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Quem concentrou os maiores volumes financeiros no recorte.
            </p>
          </div>
        </div>

        {hiddenCount > 0 ? (
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {hiddenCount.toLocaleString("pt-BR")} ocultos
          </span>
        ) : null}
      </div>

      {isLoading ? <LoadingState message="Carregando ranking de gastos..." /> : null}
      {error ? <ErrorStateWithRetry error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && !nodesToShow.length ? (
        <EmptyState
          message={
            allNodes.length
              ? "A API retornou apenas registros anonimizados ou sob sigilo para este recorte."
              : "Nenhum gastador retornado para este recorte."
          }
        />
      ) : null}

      {!isLoading && !error && leader ? (
        <div className="overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/8 via-white to-cyan-50 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Maior concentracao
              </p>
              <h4 className="mt-2 break-words text-base font-bold text-foreground sm:text-lg">{leader.nomeViajante || "-"}</h4>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {leader.cargo || leader.funcao || "Cargo nao informado"}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold text-primary">
              <Medal className="h-3.5 w-3.5" />
              #1
            </span>
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
                Viagens
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCountCompact(leader.totalViagens ?? 0)}
              </p>
            </article>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && nodesToShow.length ? (
        <div className="mt-4 space-y-3">
          {nodesToShow.map((item, index) => {
            const value = centsToNumber(item.totalGastoLiquidoCents);
            const width = `${Math.max((value / maxValue) * 100, 8)}%`;

            return (
              <article
                key={`${item.cpfViajante || item.nomeViajante}-${index}`}
                className="min-w-0 overflow-hidden rounded-[24px] border border-border/70 bg-background/90 p-3 sm:p-4"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
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
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-400"
                      style={{ width }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
                    <span className="text-muted-foreground">
                      {formatCountCompact(item.totalViagens ?? 0)} viagens
                    </span>
                    <span className="truncate text-muted-foreground">
                      {item.totalViagens?.toLocaleString("pt-BR") ?? "0"} no recorte
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

export default TopGastadoresCard;
