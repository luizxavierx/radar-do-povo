import { Building2 } from "lucide-react";
import type { Connection, ViagemOrgaoRanking } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { formatCents } from "@/lib/formatters";

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

export default TopOrgaosCard;
