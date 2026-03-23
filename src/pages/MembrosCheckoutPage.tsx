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
import { getMemberChargeStatusMeta, PUSHINPAY_NOTICE } from "@/lib/members";

const checkoutSteps = [
  "Gere ou atualize o PIX pelo portal.",
  "Pague pelo QR Code ou copia e cola no app do banco.",
  "Aguarde a confirmacao para liberar ou renovar o acesso.",
];

const MembrosCheckoutPage = () => {
  const { account, createCheckoutPix, refreshAccount, loading } = useMemberSession();
  const latestCharge = account?.latestCharge ?? null;
  const membership = account?.membership ?? null;
  const chargeMeta = getMemberChargeStatusMeta(latestCharge?.status);

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
      return "Gerar novo PIX mensal";
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
      title="Ative ou renove sua assinatura mensal"
      intro="O checkout foi reorganizado para mostrar apenas o que o membro precisa acompanhar: valor do plano, estado da cobranca e o proximo passo para liberar a conta."
    >
      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Assinatura mensal
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground">{membership.priceLabel}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use esta tela para emitir o PIX do plano e acompanhar a confirmacao do pagamento sem
            sair do portal.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Status do checkout</p>
            <div
              className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${chargeMeta.badgeClassName}`}
            >
              {chargeMeta.label}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{chargeMeta.description}</p>
          </div>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Passo a passo</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              {checkoutSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Valor do plano</p>
              <p className="mt-2">{membership.priceLabel}</p>
              <p className="mt-1 text-xs">{membership.priceCents} centavos.</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Ciclo da conta</p>
              <p className="mt-2">
                {membership.currentPeriodEndsAt
                  ? new Date(membership.currentPeriodEndsAt).toLocaleString("pt-BR")
                  : "Aguardando confirmacao do primeiro pagamento."}
              </p>
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
            Atualizar status
          </Button>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Cobranca atual
          </p>

          {latestCharge ? (
            <div className="mt-4 grid gap-5 xl:grid-cols-[270px_1fr]">
              <div className="rounded-[28px] border border-border/70 bg-white p-4">
                {latestCharge.qrCodeBase64 ? (
                  <img
                    src={latestCharge.qrCodeBase64}
                    alt="QR Code PIX da assinatura"
                    className="mx-auto aspect-square w-full max-w-[230px] rounded-2xl border border-border/70 bg-white object-contain"
                  />
                ) : (
                  <div className="mx-auto flex aspect-square w-full max-w-[230px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                    QR Code indisponivel
                  </div>
                )}

                <div
                  className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${chargeMeta.badgeClassName}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {chargeMeta.label}
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
                  <p className="text-sm font-semibold text-foreground">Codigo copia e cola</p>
                  <p className="mt-2 break-all font-mono text-xs leading-6 text-muted-foreground">
                    {latestCharge.qrCode || "O codigo aparecera assim que a cobranca for emitida."}
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
                    <p className="font-semibold text-foreground">Ultima atualizacao</p>
                    <p className="mt-2">
                      {latestCharge.updatedAt
                        ? new Date(latestCharge.updatedAt).toLocaleString("pt-BR")
                        : "Sem atualizacao registrada."}
                    </p>
                    <p className="mt-1 text-xs">O portal consulta o estado salvo mais recente.</p>
                  </div>
                </div>

                {latestCharge.status === "paid" ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                    Pagamento confirmado. O proximo passo e voltar ao dashboard para gerar ou
                    renovar sua chave da API.
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    Enquanto a cobranca estiver em <strong>{latestCharge.status}</strong>, o portal
                    continua aguardando a confirmacao do pagamento para liberar o acesso.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[28px] border border-dashed border-border/80 bg-background/70 p-6 text-center">
              <QrCode className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum PIX gerado ainda</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Gere a primeira cobranca para exibir QR Code, codigo copia e cola e estado do
                checkout mensal.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 rounded-[30px] border border-amber-300/60 bg-amber-50 p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700" />
          <div className="text-sm leading-6 text-amber-900">
            <p className="font-semibold">Aviso obrigatorio sobre a PUSHIN PAY</p>
            <p className="mt-2">{PUSHINPAY_NOTICE}</p>
          </div>
        </div>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosCheckoutPage;
