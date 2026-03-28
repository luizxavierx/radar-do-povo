import {
  ArrowUpDown,
  ArrowUpRight,
  CalendarRange,
  ChevronRight,
  Landmark,
  MapPin,
  Plane,
  Wallet,
} from "lucide-react";

import type { Connection, Viagem } from "@/api/types";
import PaginationControls, { type PaginationDensity } from "@/components/PaginationControls";
import { EmptyState, ErrorStateWithRetry } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  formatDate,
  toBigInt,
} from "@/lib/formatters";

export type ViagensSortKey = "data_desc" | "data_asc" | "valor_desc" | "valor_asc";

interface ViagensTableProps {
  data?: Connection<Viagem>;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
  onOpenDetail: (viagem: Viagem) => void;
  selectedProcessoId?: string;
  sortBy: ViagensSortKey;
  onSortChange: (nextSort: ViagensSortKey) => void;
  onPageChange: (nextOffset: number) => void;
  density: PaginationDensity;
  onDensityChange: (density: PaginationDensity) => void;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
}

function getViagemTotalCents(viagem: Viagem): bigint {
  const total =
    toBigInt(viagem.valorDiariasCents) +
    toBigInt(viagem.valorPassagensCents) +
    toBigInt(viagem.valorOutrosGastosCents) -
    toBigInt(viagem.valorDevolucaoCents);

  return total > 0n ? total : 0n;
}

function sortRows(rows: Viagem[], sortBy: ViagensSortKey) {
  return [...rows].sort((left, right) => {
    const leftDate = left.dataInicio ? new Date(left.dataInicio).getTime() : 0;
    const rightDate = right.dataInicio ? new Date(right.dataInicio).getTime() : 0;
    const leftValue = getViagemTotalCents(left);
    const rightValue = getViagemTotalCents(right);

    if (sortBy === "data_asc") return leftDate - rightDate;
    if (sortBy === "data_desc") return rightDate - leftDate;
    if (sortBy === "valor_asc") return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
    return rightValue < leftValue ? -1 : rightValue > leftValue ? 1 : 0;
  });
}

function nextSort(current: ViagensSortKey, axis: "data" | "valor"): ViagensSortKey {
  if (axis === "data") {
    return current === "data_desc" ? "data_asc" : "data_desc";
  }

  return current === "valor_desc" ? "valor_asc" : "valor_desc";
}

function sortLabel(sortBy: ViagensSortKey, axis: "data" | "valor") {
  if (axis === "data") {
    return sortBy === "data_asc" ? "asc" : "desc";
  }

  return sortBy === "valor_asc" ? "asc" : "desc";
}

const ViagensTable = ({
  data,
  isLoading,
  error,
  onRetry,
  onOpenDetail,
  selectedProcessoId,
  sortBy,
  onSortChange,
  onPageChange,
  density,
  onDensityChange,
  pageSizeOptions,
  onPageSizeChange,
}: ViagensTableProps) => {
  const rows = sortRows(data?.nodes ?? [], sortBy);
  const currentPage = data ? Math.floor(data.offset / data.limit) + 1 : 1;
  const totalPages = data?.total ? Math.ceil(data.total / data.limit) : 1;
  const pageTotal = rows.reduce((acc, item) => acc + getViagemTotalCents(item), 0n);
  const showingFrom = rows.length ? (data?.offset ?? 0) + 1 : 0;
  const showingTo = rows.length ? (data?.offset ?? 0) + rows.length : 0;
  const rowPadding = density === "compact" ? "py-3" : "py-5";
  const mobileRowPadding = density === "compact" ? "p-3" : "p-4";

  return (
    <section
      id="viagens-lista"
      className="min-w-0 rounded-[30px] border border-border/75 bg-card/92 p-5 shadow-card sm:p-6"
    >
      <div className="rounded-[30px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div>
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">
                Viagens no detalhe
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Lista principal do recorte atual.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[380px]">
            <article className="rounded-2xl border border-border/70 bg-white/85 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Nesta pagina
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCountCompact(rows.length)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Itens {showingFrom} a {showingTo || 0}
              </p>
            </article>

            <article className="rounded-2xl border border-border/70 bg-white/85 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total estimado da pagina
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {formatCentsCompact(pageTotal.toString())}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatCents(pageTotal.toString())}
              </p>
            </article>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
              <Plane className="h-3.5 w-3.5 text-primary" />
              {formatCountCompact(data?.total ?? 0)} viagens no recorte
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Pagina {currentPage} de {totalPages}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
              densidade {density === "compact" ? "compacta" : "confortavel"}
            </span>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="justify-center rounded-xl bg-white sm:flex-none"
              onClick={() => onSortChange(nextSort(sortBy, "data"))}
            >
              <CalendarRange className="h-4 w-4" />
              Data {sortLabel(sortBy, "data")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-center rounded-xl bg-white sm:flex-none"
              onClick={() => onSortChange(nextSort(sortBy, "valor"))}
            >
              <ArrowUpDown className="h-4 w-4" />
              Valor {sortLabel(sortBy, "valor")}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 pt-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="pt-5">
          <ErrorStateWithRetry error={error} onRetry={onRetry} />
        </div>
      ) : null}

      {!isLoading && !error && !rows.length ? (
        <div className="pt-5">
          <EmptyState message="Nenhuma viagem retornada para os filtros atuais." />
        </div>
      ) : null}

      {!isLoading && !error && rows.length ? (
        <>
          <div className="mt-5 max-h-[68vh] overflow-y-auto overscroll-contain rounded-[28px] border border-border/70 bg-background/90 md:hidden">
            <div>
              {rows.map((viagem) => {
                const isActive = selectedProcessoId === viagem.processoId;
                const total = getViagemTotalCents(viagem);

                return (
                  <button
                    key={viagem.processoId || `${viagem.nomeViajante}-${viagem.dataInicio}`}
                    type="button"
                    onClick={() => onOpenDetail(viagem)}
                    className={`block w-full border-b border-border/70 text-left transition-colors last:border-b-0 ${
                      isActive ? "bg-primary/5" : "bg-background/85 hover:bg-slate-50"
                    } ${mobileRowPadding}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-bold text-foreground">
                          {viagem.nomeViajante || "-"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {viagem.cargo || viagem.funcao || viagem.descricaoFuncao || "Cargo nao informado"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatCentsCompact(total.toString())}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatCents(total.toString())}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <CalendarRange className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          {formatDate(viagem.dataInicio)} ate {formatDate(viagem.dataFim)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">
                          {viagem.orgaoSuperiorNome || "Orgao superior nao informado"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">
                          {viagem.destinos || "Destino nao informado"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        {viagem.situacao ? (
                          <span className="rounded-full border border-border bg-card px-2 py-1">
                            {viagem.situacao}
                          </span>
                        ) : null}
                        {viagem.viagemUrgente ? (
                          <span className="rounded-full border border-amber-300/50 bg-amber-50 px-2 py-1 text-amber-700">
                            urgente
                          </span>
                        ) : null}
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        Detalhe
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 hidden max-h-[72vh] overflow-auto rounded-3xl border border-border/70 bg-background/80 md:block">
            <div className="w-full">
              <div className="min-w-[1040px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/70 bg-muted/25 hover:bg-muted/25">
                      <TableHead className="sticky top-0 z-10 bg-muted/85 backdrop-blur">Viajante</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-muted/85 backdrop-blur">Orgaos</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-muted/85 backdrop-blur">Periodo</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-muted/85 backdrop-blur">Destino</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-muted/85 text-right backdrop-blur">
                        Total estimado
                      </TableHead>
                      <TableHead className="sticky top-0 z-10 w-[140px] bg-muted/85 text-right backdrop-blur">
                        Detalhe
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((viagem) => {
                      const isActive = selectedProcessoId === viagem.processoId;
                      const total = getViagemTotalCents(viagem);

                      return (
                        <TableRow
                          key={viagem.processoId || `${viagem.nomeViajante}-${viagem.dataInicio}`}
                          className={isActive ? "bg-primary/5" : ""}
                        >
                          <TableCell className={rowPadding}>
                            <div className="min-w-[240px]">
                              <p className="text-sm font-semibold text-foreground">
                                {viagem.nomeViajante || "-"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {viagem.cargo || viagem.funcao || viagem.descricaoFuncao || "Cargo nao informado"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                {viagem.situacao ? (
                                  <span className="rounded-full border border-border bg-card px-2 py-1">
                                    {viagem.situacao}
                                  </span>
                                ) : null}
                                {viagem.viagemUrgente ? (
                                  <span className="rounded-full border border-amber-300/50 bg-amber-50 px-2 py-1 text-amber-700">
                                    urgente
                                  </span>
                                ) : null}
                                {viagem.processoId ? (
                                  <span className="rounded-full border border-border bg-card px-2 py-1">
                                    processo {viagem.processoId}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={rowPadding}>
                            <div className="min-w-[220px] text-xs">
                              <div className="flex items-center gap-2 text-foreground">
                                <Landmark className="h-3.5 w-3.5 text-primary" />
                                <span className="font-medium">
                                  {viagem.orgaoSuperiorNome || "Orgao superior nao informado"}
                                </span>
                              </div>
                              <p className="mt-2 text-muted-foreground">
                                {viagem.orgaoSolicitanteNome || "Orgao solicitante nao informado"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className={rowPadding}>
                            <div className="min-w-[150px] text-xs">
                              <p className="font-medium text-foreground">{formatDate(viagem.dataInicio)}</p>
                              <p className="mt-1 text-muted-foreground">ate {formatDate(viagem.dataFim)}</p>
                              {viagem.ano ? (
                                <p className="mt-2 text-[11px] text-muted-foreground">ano {viagem.ano}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className={rowPadding}>
                            <div className="max-w-[280px] text-xs">
                              <p className="font-medium text-foreground">
                                {viagem.destinos || "Destino nao informado"}
                              </p>
                              <p className="mt-1 line-clamp-2 text-muted-foreground">
                                {viagem.motivo || "Motivo nao informado"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className={`${rowPadding} text-right`}>
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="text-sm font-bold text-foreground">
                                {formatCentsCompact(total.toString())}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatCents(total.toString())}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                passagens {formatCentsCompact(viagem.valorPassagensCents)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={`${rowPadding} text-right`}>
                            <Button
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className="rounded-xl"
                              onClick={() => onOpenDetail(viagem)}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                              Abrir
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <PaginationControls
            total={data?.total ?? 0}
            limit={data?.limit ?? 20}
            offset={data?.offset ?? 0}
            onPageChange={onPageChange}
            density={density}
            onDensityChange={onDensityChange}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      ) : null}
    </section>
  );
};

export default ViagensTable;
