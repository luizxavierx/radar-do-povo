import {
  ArrowUpDown,
  ArrowUpRight,
  CalendarRange,
  Landmark,
  Plane,
  Wallet,
} from "lucide-react";
import type { Connection, Viagem } from "@/api/types";
import PaginationControls from "@/components/PaginationControls";
import { EmptyState, ErrorStateWithRetry } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

function sortExplanation(sortBy: ViagensSortKey) {
  if (sortBy === "data_desc") return "mais recentes primeiro";
  if (sortBy === "data_asc") return "mais antigas primeiro";
  if (sortBy === "valor_desc") return "maiores valores primeiro";
  return "menores valores primeiro";
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
}: ViagensTableProps) => {
  const rows = sortRows(data?.nodes ?? [], sortBy);
  const currentPage = data ? Math.floor(data.offset / data.limit) + 1 : 1;
  const totalPages = data?.total ? Math.ceil(data.total / data.limit) : 1;
  const pageTotal = rows.reduce((acc, item) => acc + getViagemTotalCents(item), 0n);
  const showingFrom = rows.length ? (data?.offset ?? 0) + 1 : 0;
  const showingTo = rows.length ? (data?.offset ?? 0) + rows.length : 0;

  return (
    <section className="min-w-0 rounded-[28px] border border-border/75 bg-card/92 p-5 shadow-card sm:p-6">
      <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Plane className="h-3.5 w-3.5" />
              Tabela principal
            </p>
            <div>
              <h3 className="text-xl font-extrabold text-foreground">
                Lista principal de viagens
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Veja nomes, orgaos, destinos e valores em uma grade clara. O detalhe completo
                abre so quando fizer sentido aprofundar.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[520px]">
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

            <article className="rounded-2xl border border-border/70 bg-white/85 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Leitura atual
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                Pagina {currentPage} de {totalPages}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{sortExplanation(sortBy)}</p>
            </article>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Total do recorte: {formatCountCompact(data?.total ?? 0)} viagens
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
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
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
          <div className="mt-5 overflow-hidden rounded-[28px] border border-border/70 bg-background/90 md:hidden">
            {rows.map((viagem) => {
              const isActive = selectedProcessoId === viagem.processoId;
              const total = getViagemTotalCents(viagem);

              return (
                <button
                  key={viagem.processoId || `${viagem.nomeViajante}-${viagem.dataInicio}`}
                  type="button"
                  onClick={() => onOpenDetail(viagem)}
                  className={`block w-full border-b border-border/70 p-4 text-left transition-colors last:border-b-0 ${
                    isActive
                      ? "border-primary/30 bg-primary/5"
                      : "bg-background/85 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
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
                          <p className="text-sm font-extrabold text-foreground">
                            {formatCentsCompact(total.toString())}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCents(total.toString())}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
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
                        {viagem.ano ? (
                          <span className="rounded-full border border-border bg-card px-2 py-1">
                            ano {viagem.ano}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-3 rounded-[22px] border border-border/60 bg-white/85 p-3 text-xs sm:grid-cols-[1fr_auto] sm:items-start">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-foreground">Destino</p>
                            <p className="mt-1 line-clamp-1 text-muted-foreground">
                              {viagem.destinos || "Destino nao informado"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Orgao</p>
                            <p className="mt-1 line-clamp-1 text-muted-foreground">
                              {viagem.orgaoSuperiorNome || "Orgao superior nao informado"}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-foreground">{formatDate(viagem.dataInicio)}</p>
                          <p className="mt-1 text-muted-foreground">
                            ate {formatDate(viagem.dataFim)}
                          </p>
                          <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">
                            {viagem.motivo || "Motivo nao informado"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          {viagem.orgaoSolicitanteNome || "Orgao solicitante nao informado"}
                        </p>

                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Abrir detalhe
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-3xl border border-border/70 bg-background/80 md:block">
            <ScrollArea className="w-full">
              <div className="min-w-[980px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/70 bg-muted/25 hover:bg-muted/25">
                      <TableHead>Viajante</TableHead>
                      <TableHead>Orgaos</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead className="text-right">Total estimado</TableHead>
                      <TableHead className="w-[140px] text-right">Detalhe</TableHead>
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
                          <TableCell>
                            <div className="min-w-[220px]">
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
                                {viagem.pcdp ? (
                                  <span className="rounded-full border border-border bg-card px-2 py-1">
                                    pcdp {viagem.pcdp}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
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
                          <TableCell>
                            <div className="min-w-[140px] text-xs">
                              <p className="font-medium text-foreground">{formatDate(viagem.dataInicio)}</p>
                              <p className="mt-1 text-muted-foreground">ate {formatDate(viagem.dataFim)}</p>
                              {viagem.ano ? (
                                <p className="mt-2 text-[11px] text-muted-foreground">ano {viagem.ano}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[260px] text-xs">
                              <p className="font-medium text-foreground">
                                {viagem.destinos || "Destino nao informado"}
                              </p>
                              <p className="mt-1 line-clamp-2 text-muted-foreground">
                                {viagem.motivo || "Motivo nao informado"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
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
                          <TableCell className="text-right">
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 p-4">
            <PaginationControls
              total={data?.total ?? 0}
              limit={data?.limit ?? 20}
              offset={data?.offset ?? 0}
              onPageChange={onPageChange}
            />
          </div>
        </>
      ) : null}
    </section>
  );
};

export default ViagensTable;
