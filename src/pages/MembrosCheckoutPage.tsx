import { useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { PUSHINPAY_NOTICE } from "@/lib/members";

const MembrosCheckoutPage = () => {
  const { account, createCheckoutPix, refreshAccount, loading } = useMemberSession();
  const latestCharge = account?.latestCharge ?? null;
  const membership = account?.membership ?? null;

  useEffect(() => {
    if (latestCharge?.status !== "created") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshAccount().catch(() => undefined);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [latestCharge?.status, refreshAccount]);

  const checkoutLabel = useMemo(() => {
    if (membership?.status === "active") {
      return "Renovar ou antecipar mensalidade";
    }

    return `Gerar PIX de ${membership?.priceLabel ?? "R$ 15/mensal"}`;
  }, [membership?.priceLabel, membership?.status]);

  const handleGeneratePix = async () => {
    try {
      const charge = await createCheckoutPix();
      toast.success(`PIX ${charge.status === "created" ? "gerado" : "atualizado"} com sucesso.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar o PIX.");
    }
  };

  const handleCopyPix = async () => {
    if (!latestCharge?.qrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestCharge.qrCode);
      toast.success("Codigo PIX copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o codigo PIX automaticamente.");
    }
  };

  if (!account || !membership) {
    return null;
  }

  return (
    <MemberPortalShell
      eyebrow="Checkout PIX"
      title="Assinatura mensal da area de membros"
      intro="O checkout agora e gerado pelo backend Laravel com token da PushinPay protegido no servidor e status retornado ao portal de membros."
    >
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Plano mensal
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground">{membership.priceLabel}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            O billing e criado no Laravel e entrega ao front apenas QR Code, copia e cola e estado da cobranca.
          </p>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Parametros do checkout</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Valor cobrado: {membership.priceCents} centavos.</li>
              <li>Webhook previsto: atualiza a cobranca e ativa o plano apos pagamento.</li>
              <li>Chave da PushinPay permanece exclusivamente no backend.</li>
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
            onClick={() => void handleGeneratePix()}
            disabled={loading}
            className="mt-6 h-12 w-full rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando checkout
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                {checkoutLabel}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshAccount()}
            disabled={loading}
            className="mt-3 h-11 w-full rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar status do pagamento
          </Button>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            QR Code da cobranca
          </p>

          {latestCharge ? (
            <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="rounded-[28px] border border-border/70 bg-white p-4">
                {latestCharge.qrCodeBase64 ? (
                  <img
                    src={latestCharge.qrCodeBase64}
                    alt="QR Code PIX do plano mensal"
                    className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl border border-border/70 bg-white object-contain"
                  />
                ) : (
                  <div className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                    QR Code indisponivel
                  </div>
                )}

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {latestCharge.status}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
                  <p className="text-sm font-semibold text-foreground">Referencia da cobranca</p>
                  <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
                    {latestCharge.id}
                  </p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
                  <p className="text-sm font-semibold text-foreground">Codigo PIX copia e cola</p>
                  <p className="mt-2 break-all font-mono text-xs leading-6 text-muted-foreground">
                    {latestCharge.qrCode || "Aguarde a emissao do QR Code."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopyPix()}
                    className="mt-4 rounded-full"
                    disabled={!latestCharge.qrCode}
                  >
                    <Copy className="h-4 w-4" />
                    Copiar codigo PIX
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Valor</p>
                    <p className="mt-2">{membership.priceLabel}</p>
                    <p className="mt-1 text-xs">{latestCharge.value} centavos no provider.</p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Atualizacao</p>
                    <p className="mt-2">
                      {latestCharge.updatedAt
                        ? new Date(latestCharge.updatedAt).toLocaleString("pt-BR")
                        : "Sem atualizacao registrada."}
                    </p>
                    <p className="mt-1 text-xs">
                      O portal consulta o estado mais recente salvo pelo webhook.
                    </p>
                  </div>
                </div>

                {latestCharge.status === "paid" ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                    Pagamento confirmado. Volte ao painel para gerar a sua chave unica da API.
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    Enquanto a cobranca estiver em <strong>{latestCharge.status}</strong>, o portal
                    continua aguardando a confirmacao do webhook para ativar o plano.
                  </div>
                )}
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
