import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { MEMBER_PLAN, PUSHINPAY_NOTICE } from "@/lib/members";

const MembrosCheckoutPage = () => {
  const { session, pixCharge, createPixCharge, clearPixCharge } = useMemberSession();
  const [submitting, setSubmitting] = useState(false);

  const handleGeneratePix = async () => {
    setSubmitting(true);

    try {
      await createPixCharge({
        payerName: session?.name,
        payerEmail: session?.email,
      });
      toast.success("PIX gerado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar o PIX.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixCharge?.qrCode) {
      return;
    }

    await navigator.clipboard.writeText(pixCharge.qrCode);
    toast.success("Codigo PIX copiado.");
  };

  return (
    <MemberPortalShell
      eyebrow="Checkout PIX"
      title="Assinatura mensal da area de membros"
      intro="O front do checkout ja esta preparado para um fluxo PIX mensal: resumo do plano, aviso obrigatorio sobre a PushinPay, QR Code, copia e cola e referencia da cobranca."
    >
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Plano mensal
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground">{MEMBER_PLAN.priceLabel}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{MEMBER_PLAN.description}</p>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Parametros do checkout</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Valor enviado para o backend de cobranca: {MEMBER_PLAN.priceCents} centavos.</li>
              <li>Webhook recomendado para confirmacao real do pagamento.</li>
              <li>Fluxo preparado para server-side, sem expor o token da PushinPay no navegador.</li>
            </ul>
          </div>

          <div className="mt-6 rounded-[24px] border border-amber-300/60 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700" />
              <div className="text-sm leading-6 text-amber-900">
                <p className="font-semibold">Aviso obrigatorio sobre a PUSHIN PAY</p>
                <p className="mt-2">{PUSHINPAY_NOTICE}</p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleGeneratePix}
            disabled={submitting}
            className="mt-6 h-12 w-full rounded-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PIX
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Gerar PIX de R$ 15
              </>
            )}
          </Button>

          {pixCharge ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearPixCharge}
              className="mt-3 h-11 w-full rounded-full"
            >
              Limpar cobranca atual
            </Button>
          ) : null}
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            QR Code da cobranca
          </p>

          {pixCharge ? (
            <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="rounded-[28px] border border-border/70 bg-white p-4">
                <img
                  src={pixCharge.qrCodeImage}
                  alt="QR Code PIX do plano mensal"
                  className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl border border-border/70 bg-white object-contain"
                />
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {pixCharge.status}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
                  <p className="text-sm font-semibold text-foreground">Referencia da cobranca</p>
                  <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
                    {pixCharge.id}
                  </p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
                  <p className="text-sm font-semibold text-foreground">Codigo PIX copia e cola</p>
                  <p className="mt-2 break-all font-mono text-xs leading-6 text-muted-foreground">
                    {pixCharge.qrCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPix}
                    className="mt-4 rounded-full"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar codigo PIX
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Valor</p>
                    <p className="mt-2">{MEMBER_PLAN.priceLabel}</p>
                    <p className="mt-1 text-xs">Cobrado em centavos no endpoint de billing.</p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Modo atual</p>
                    <p className="mt-2 uppercase">{pixCharge.mode}</p>
                    <p className="mt-1 text-xs">
                      Use o endpoint server-side real para trocar o modo mock pelo fluxo live.
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                  Assim que o backend de billing estiver plugado de ponta a ponta, esse mesmo
                  checkout vai refletir o status real da transacao e habilitar a emissao da chave
                  unica do membro.
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[28px] border border-dashed border-border/80 bg-background/70 p-6 text-center">
              <QrCode className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum PIX gerado ainda</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Gere a cobranca para exibir QR Code, codigo copia e cola e o estado atual do
                checkout mensal.
              </p>
            </div>
          )}
        </article>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosCheckoutPage;
