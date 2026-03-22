import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

const PaginationControls = ({ total, limit, offset, onPageChange }: PaginationControlsProps) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="mt-4 rounded-[24px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Navegacao da lista
          </p>
          <p className="text-sm font-semibold text-foreground">
            {offset + 1}-{Math.min(offset + limit, total)} de {total.toLocaleString("pt-BR")} viagens
          </p>
          <p className="text-xs text-muted-foreground">
            Pagina {currentPage} de {totalPages.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[560px]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-white"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 1}
              aria-label="Primeira pagina"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-white"
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              disabled={offset === 0}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <ScrollArea className="w-full rounded-2xl border border-border/70 bg-white/85">
              <div className="flex min-w-max items-center gap-2 px-2 py-2">
                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange((item - 1) * limit)}
                      className={cn(
                        "inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition-colors",
                        item === currentPage
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/70 bg-white text-foreground hover:bg-muted"
                      )}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={`Ir para a pagina ${item}`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-white"
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= total}
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-white"
              onClick={() => onPageChange((totalPages - 1) * limit)}
              disabled={currentPage === totalPages}
              aria-label="Ultima pagina"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;

function buildPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);

  return items;
}
