import { Clock3, ExternalLink, Newspaper } from "lucide-react";

import type { NewsItem } from "@/api/types";
import { EmptyState, ErrorStateWithRetry } from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";

interface PoliticoNewsSectionProps {
  politico: string;
  items: NewsItem[];
  total?: number;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function PoliticoNewsSection({
  politico,
  items,
  total = 0,
  isLoading = false,
  error = null,
  onRetry,
}: PoliticoNewsSectionProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Newspaper className="h-4.5 w-4.5 text-primary" />
            Noticias recentes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manchetes mais recentes encontradas em RSS para{" "}
            <strong className="text-foreground">{politico}</strong>.
          </p>
        </div>

        {total > items.length ? (
          <p className="text-[11px] font-medium text-muted-foreground">
            Exibindo {items.length} de {total} noticias filtradas.
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        {isLoading ? <PoliticoNewsSkeleton /> : null}
        {!isLoading && error ? (
          <ErrorStateWithRetry error={error} onRetry={() => onRetry?.()} retryLabel="Recarregar noticias" />
        ) : null}
        {!isLoading && !error && items.length === 0 ? (
          <EmptyState message="Nenhuma noticia recente encontrada nos feeds configurados para este politico." />
        ) : null}
        {!isLoading && !error && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((item, index) => (
              <article
                key={`${item.link}-${index}`}
                className="rounded-xl border border-border/70 bg-background/80 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                    {item.sourceName}
                  </span>
                  {item.publishedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                      <Clock3 className="h-3 w-3" />
                      {formatDate(item.publishedAt)}
                    </span>
                  ) : null}
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-start gap-2 text-sm font-semibold leading-6 text-foreground hover:text-primary"
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                </a>

                {item.summary ? (
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {item.summary}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PoliticoNewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border/70 bg-background/80 p-4"
        >
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-11/12" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-10/12" />
        </div>
      ))}
    </div>
  );
}
