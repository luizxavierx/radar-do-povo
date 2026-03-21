import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

const PaginationControls = ({ total, limit, offset, onPageChange }: PaginationControlsProps) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {offset + 1}-{Math.min(offset + limit, total)} de {total}
      </p>

      <div className="grid w-full grid-cols-[40px_1fr_40px] items-center gap-2 sm:w-auto">
        <button
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-16 rounded-xl border border-border/70 bg-background px-3 py-2 text-center text-xs font-semibold text-foreground">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Proxima pagina"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
