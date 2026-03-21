import { Crown, Plane } from "lucide-react";
import type { Connection, ViagemPessoaRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { formatCents } from "@/lib/formatters";
import { filterVisibleTravelerRankings } from "@/lib/viagens";

interface TopViajantesCardProps {
  data?: Connection<ViagemPessoaRanking>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

const TopViajantesCard = ({
  data,
  isLoading,
  error,
  onRetry,
}: TopViajantesCardProps) => {
  const allNodes = data?.nodes ?? [];
  const visibleNodes = filterVisibleTravelerRankings(allNodes);
  const hiddenCount = allNodes.length - visibleNodes.length;
  const nodesToShow = visibleNodes.slice(0, 5);

  return (
    <section className="rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-soft p-3 text-primary">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold">Top viajantes</h3>
          <p className="text-xs text-muted-foreground">Quem mais viajou no recorte atual</p>
        </div>
      </div>
      {hiddenCount > 0 ? (
        <p className="mb-4 text-[11px] text-muted-foreground">
          {hiddenCount.toLocaleString("pt-BR")} registros anonimizados ou sob sigilo foram ocultados
          do top visual.
        </p>
      ) : null}

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

      <div className="space-y-2">
        {nodesToShow.map((item, index) => (
          <article
            key={`${item.cpfViajante || item.nomeViajante}-${index}`}
            className="rounded-2xl border border-border/70 bg-background/90 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
                  {item.nomeViajante || "-"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.cargo || item.funcao || "Cargo nao informado"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                <Crown className="h-3 w-3" />
                #{index + 1}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {(item.totalViagens ?? 0).toLocaleString("pt-BR")} viagens no recorte
              </span>
              <span className="font-semibold text-primary">
                {formatCents(item.totalGastoLiquidoCents)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TopViajantesCard;
