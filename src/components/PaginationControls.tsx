import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PaginationDensity = "comfortable" | "compact";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  density?: PaginationDensity;
  onDensityChange?: (density: PaginationDensity) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

const PaginationControls = ({
  total,
  limit,
  offset,
  onPageChange,
  density = "comfortable",
  onDensityChange,
  pageSizeOptions = [20, 40, 60],
  onPageSizeChange,
}: PaginationControlsProps) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1 && !onDensityChange && !onPageSizeChange) return null;

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="mt-4 rounded-[24px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Navegacao da lista
            </p>
            <p className="text-sm font-semibold text-foreground">
              {total > 0
                ? `${offset + 1}-${Math.min(offset + limit, total)} de ${total.toLocaleString("pt-BR")} viagens`
                : "Nenhum resultado nesta pagina"}
            </p>
            <p className="text-xs text-muted-foreground">
              Pagina {currentPage} de {totalPages.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(160px,180px)_minmax(180px,220px)]">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Itens por pagina
              </label>
              <Select
                value={String(limit)}
                onValueChange={(value) => onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-11 rounded-2xl bg-white">
                  <SelectValue placeholder="Itens por pagina" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} itens
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Densidade da lista
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onDensityChange?.("comfortable")}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border bg-white px-3 text-sm font-semibold transition-colors",
                    density === "comfortable"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-foreground hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Conforto
                </button>
                <button
                  type="button"
                  onClick={() => onDensityChange?.("compact")}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border bg-white px-3 text-sm font-semibold transition-colors",
                    density === "compact"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-foreground hover:bg-muted"
                  )}
                >
                  <ListFilter className="h-4 w-4" />
                  Compacta
                </button>
              </div>
            </div>
          </div>
        </div>

        {totalPages > 1 ? (
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

            <div className="w-full overflow-x-auto rounded-2xl border border-border/70 bg-white/85 overscroll-x-contain">
              <div className="flex min-w-max snap-x snap-mandatory items-center gap-1.5 px-1.5 py-1.5">
                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-muted-foreground sm:h-10 sm:w-10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange((item - 1) * limit)}
                      className={cn(
                        "inline-flex h-9 min-w-9 shrink-0 snap-start items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition-colors sm:h-10 sm:min-w-10 sm:text-sm",
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
            </div>

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
        ) : null}
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
