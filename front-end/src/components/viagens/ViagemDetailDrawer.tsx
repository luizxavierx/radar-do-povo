import type { ReactNode } from "react";
import {
  ArrowRightLeft,
  Building2,
  CalendarRange,
  ClipboardList,
  CreditCard,
  Plane,
  Wallet,
  X,
} from "lucide-react";
import type { Viagem } from "@/api/types";
import { EmptyState, ErrorStateWithRetry, LoadingState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCents, formatDate, toBigInt } from "@/lib/formatters";
import type { ViagemDetalheResult } from "@/services/viagensService";

interface ViagemDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viagemBase?: Viagem | null;
  detail?: ViagemDetalheResult;
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

function getViagemTotal(viagem?: Viagem | null) {
  if (!viagem) return "R$ 0,00";

  const total =
    toBigInt(viagem.valorDiariasCents) +
    toBigInt(viagem.valorPassagensCents) +
    toBigInt(viagem.valorOutrosGastosCents) -
    toBigInt(viagem.valorDevolucaoCents);

  return formatCents((total > 0n ? total : 0n).toString());
}

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl border border-border/70 bg-background/80 p-3 sm:p-4">
    <div className="mb-3">
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
    {children}
  </section>
);

const ViagemDetailDrawer = ({
  open,
  onOpenChange,
  viagemBase,
  detail,
  isLoading,
  error,
  onRetry,
}: ViagemDetailDrawerProps) => {
  const viagem = detail?.viagem ? { ...(viagemBase || {}), ...detail.viagem } : viagemBase;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto h-[92vh] max-w-6xl rounded-t-[28px] border-border bg-white">
        <DrawerHeader className="border-b border-border/70 px-4 pb-5 pt-4 text-left sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Plane className="h-3.5 w-3.5" />
                Detalhe da Viagem
              </p>
              <DrawerTitle className="text-2xl font-extrabold text-foreground">
                {viagem?.nomeViajante || "Viagem oficial"}
              </DrawerTitle>
              <DrawerDescription className="max-w-3xl break-words text-sm text-muted-foreground">
                {viagem?.cargo || viagem?.funcao || viagem?.descricaoFuncao || "Cargo nao informado"}
                {" | "}
                processo {viagem?.processoId || "-"}
                {viagem?.pcdp ? ` | pcdp ${viagem.pcdp}` : ""}
              </DrawerDescription>
            </div>

            <DrawerClose asChild>
              <Button variant="outline" size="icon" className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
          {isLoading ? <LoadingState message="Buscando passagens, pagamentos e trechos..." /> : null}
          {error ? <ErrorStateWithRetry error={error} onRetry={onRetry} /> : null}

          {!isLoading && !error && viagem ? (
            <div className="space-y-5">
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Total estimado
                      </p>
                      <p className="mt-2 text-lg font-bold text-foreground">{getViagemTotal(viagem)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Periodo
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDate(viagem.dataInicio)} ate {formatDate(viagem.dataFim)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Passagens
                      </p>
                      <p className="mt-2 text-lg font-bold text-foreground">
                        {formatCents(viagem.valorPassagensCents)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Diarias
                      </p>
                      <p className="mt-2 text-lg font-bold text-foreground">
                        {formatCents(viagem.valorDiariasCents)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-5 shadow-card">
                  <h4 className="text-base font-bold text-foreground">Contexto da viagem</h4>
                  <div className="mt-4 space-y-3 text-sm">
                    <p className="inline-flex items-start gap-2 text-muted-foreground">
                      <Building2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        <strong className="text-foreground">Orgao superior:</strong>{" "}
                        {viagem.orgaoSuperiorNome || "Nao informado"}
                      </span>
                    </p>
                    <p className="inline-flex items-start gap-2 text-muted-foreground">
                      <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        <strong className="text-foreground">Orgao solicitante:</strong>{" "}
                        {viagem.orgaoSolicitanteNome || "Nao informado"}
                      </span>
                    </p>
                    <p className="inline-flex items-start gap-2 text-muted-foreground">
                      <CalendarRange className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        <strong className="text-foreground">Destino:</strong>{" "}
                        {viagem.destinos || "Nao informado"}
                      </span>
                    </p>
                    <p className="inline-flex items-start gap-2 text-muted-foreground">
                      <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        <strong className="text-foreground">Motivo:</strong>{" "}
                        {viagem.motivo || "Nao informado"}
                      </span>
                    </p>
                    {viagem.cpfViajante ? (
                      <p className="inline-flex items-start gap-2 text-muted-foreground">
                        <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                          <strong className="text-foreground">CPF do viajante:</strong>{" "}
                          {viagem.cpfViajante}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-3">
                <SectionCard
                  title="Passagens"
                  description={`Total retornado: ${viagem.passagens?.total ?? 0}`}
                >
                  {viagem.passagens?.nodes?.length ? (
                    <div className="space-y-3">
                      {viagem.passagens.nodes.map((passagem, index) => (
                        <article
                          key={passagem.id || `${passagem.emissaoData}-${index}`}
                          className="rounded-2xl border border-border/70 bg-card/80 p-3"
                        >
                          <div className="flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
                            <div className="min-w-0 text-xs">
                              <p className="font-semibold text-foreground">
                                {passagem.meioTransporte || "Transporte nao informado"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {passagem.idaOrigemCidade || "-"}
                                {" -> "}
                                {passagem.idaDestinoCidade || "-"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {passagem.idaOrigemUf || "-"} / {passagem.idaOrigemPais || "-"}
                                {" -> "}
                                {passagem.idaDestinoUf || "-"} / {passagem.idaDestinoPais || "-"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                volta {passagem.voltaOrigemCidade || "-"}
                                {" -> "}
                                {passagem.voltaDestinoCidade || "-"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                pcdp {passagem.pcdp || "-"} | processo {passagem.processoId || "-"}
                              </p>
                            </div>
                            <div className="text-left text-xs min-[520px]:text-right">
                              <p className="font-semibold text-foreground">
                                {formatCents(passagem.valorPassagemCents)}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                taxa {formatCents(passagem.taxaServicoCents)}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                emissao {formatDate(passagem.emissaoData)} {passagem.emissaoHora || ""}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhuma passagem encontrada nesta viagem." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Pagamentos"
                  description={`Total retornado: ${viagem.pagamentos?.total ?? 0}`}
                >
                  {viagem.pagamentos?.nodes?.length ? (
                    <div className="space-y-3">
                      {viagem.pagamentos.nodes.map((pagamento, index) => (
                        <article
                          key={pagamento.id || `${pagamento.tipoPagamento}-${index}`}
                          className="rounded-2xl border border-border/70 bg-card/80 p-3"
                        >
                          <div className="flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
                            <div className="min-w-0 text-xs">
                              <p className="font-semibold text-foreground">
                                {pagamento.tipoPagamento || "Tipo nao informado"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {pagamento.orgaoPagadorNome || "Orgao pagador nao informado"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {pagamento.ugPagadoraNome || "UG pagadora nao informada"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                superior {pagamento.orgaoSuperiorNome || "-"} | processo {pagamento.processoId || "-"}
                              </p>
                            </div>
                            <div className="text-left text-xs min-[520px]:text-right">
                              <p className="font-semibold text-foreground">
                                {formatCents(pagamento.valorCents)}
                              </p>
                              <p className="mt-1 text-muted-foreground">ano {pagamento.ano || "-"}</p>
                              <p className="mt-1 text-muted-foreground">
                                ug {pagamento.ugPagadoraCodigo || "-"} | orgao {pagamento.orgaoPagadorCodigo || "-"}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhum pagamento encontrado nesta viagem." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Trechos"
                  description={`Total retornado: ${viagem.trechos?.total ?? 0}`}
                >
                  {viagem.trechos?.nodes?.length ? (
                    <div className="space-y-3">
                      {viagem.trechos.nodes.map((trecho, index) => (
                        <article
                          key={trecho.id || `${trecho.sequencia}-${index}`}
                          className="rounded-2xl border border-border/70 bg-card/80 p-3"
                        >
                          <div className="flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
                            <div className="min-w-0 text-xs">
                              <p className="font-semibold text-foreground">
                                trecho {trecho.sequencia || index + 1}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {trecho.origemCidade || "-"}
                                {" -> "}
                                {trecho.destinoCidade || "-"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {trecho.origemUf || "-"} / {trecho.origemPais || "-"}
                                {" -> "}
                                {trecho.destinoUf || "-"} / {trecho.destinoPais || "-"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {formatDate(trecho.origemData)} ate {formatDate(trecho.destinoData)}
                              </p>
                            </div>
                            <div className="text-left text-xs min-[520px]:text-right">
                              <p className="font-semibold text-foreground">
                                {trecho.meioTransporte || "Sem meio"}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {trecho.numeroDiarias ?? 0} diarias
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                pcdp {trecho.pcdp || "-"} | processo {trecho.processoId || "-"}
                              </p>
                            </div>
                          </div>
                          {trecho.missao ? (
                            <p className="mt-2 text-xs text-muted-foreground">{trecho.missao}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhum trecho encontrado nesta viagem." />
                  )}
                </SectionCard>
              </div>

              <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card">
                <h4 className="text-base font-bold text-foreground">Distribuicao financeira</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Plane className="h-3.5 w-3.5" />
                      Passagens
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {formatCents(viagem.valorPassagensCents)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" />
                      Outros gastos
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {formatCents(viagem.valorOutrosGastosCents)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      Devolucao
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {formatCents(viagem.valorDevolucaoCents)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Trechos
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {viagem.trechos?.total ?? 0}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ViagemDetailDrawer;
