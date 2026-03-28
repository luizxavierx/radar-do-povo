import { useEffect, useMemo, useState } from "react";
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
import {
  formatMemberDateTime,
  formatPixCountdown,
  getMemberChargeStatusMeta,
  MEMBER_PIX_EXPIRATION_MINUTES,
  PUSHINPAY_NOTICE,
} from "@/lib/members";

const MembrosCheckoutPage = () => {
  const { account, createCheckoutPix, refreshAccount, loading } = useMemberSession();
  const latestCharge = account?.latestCharge ?? null;
  const membership = account?.membership ?? null;
  const journey = account?.journey ?? null;
  const effectiveChargeStatus = latestCharge?.isExpired ? "expired" : latestCharge?.status;
  const chargeMeta = getMemberChargeStatusMeta(effectiveChargeStatus);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(latestCharge?.expiresInSeconds ?? null);

  useEffect(() => {
    setSecondsLeft(latestCharge?.expiresInSeconds ?? null);
  }, [latestCharge?.expiresInSeconds, latestCharge?.updatedAt]);

  useEffect(() => {
    if (effectiveChargeStatus !== "created") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshAccount().catch(() => undefined);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [effectiveChargeStatus, refreshAccount]);

  useEffect(() => {
    if (effectiveChargeStatus !== "created" || !secondsLeft || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => (current && current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [effectiveChargeStatus, latestCharge?.updatedAt, secondsLeft]);

  useEffect(() => {
    if (effectiveChargeStatus === "created" && secondsLeft === 0) {
      void refreshAccount().catch(() => undefined);
    }
  }, [effectiveChargeStatus, refreshAccount, secondsLeft]);

  const checkoutLabel = useMemo(() => {
    if (effectiveChargeStatus === "created") {
      return "Atualizar estado do PIX";
    }

    if (effectiveChargeStatus === "expired") {
      return "Gerar novo PIX";
    }

    if (membership?.status === "active") {
      return "Emitir PIX de renovacao";
    }

    return `Gerar PIX de ${membership?.priceLabel ?? "R$ 15/mensal"}`;
  }, [effectiveChargeStatus, membership?.priceLabel, membership?.status]);

  const handleGeneratePix = async () => {
    try {
      const charge = await createCheckoutPix();
      toast.success(`PIX ${charge.status === "created" ? "disponivel" : "atualizado"} com sucesso.`);
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

  if (!account || !membership || !journey) {
    return null;
  }

  return (
    <MemberPortalShell
      eyebrow="Checkout PIX"
      title="Ative ou renove sua assinatura mensal"
      intro="O checkout foi organizado para mostrar apenas o que importa: valor, QR Code, prazo de pagamento e atualizacao do status da sua assinatura."
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
            Gere o PIX do plano mensal, acompanhe a janela de pagamento e volte ao painel assim
            que a confirmacao aparecer no portal.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Status do checkout</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{chargeMeta.description}</p>
              </div>

              <div
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${chargeMeta.badgeClassName}`}
              >
                {chargeMeta.label}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[20px] border border-border/70 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Validade padrao
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {MEMBER_PIX_EXPIRATION_MINUTES} minutos por cobranca
                </p>
              </div>
              <div className="rounded-[20px] border border-border/70 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Etapa atual
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{journey.title}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-900/10 bg-slate-950 p-4 text-slate-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Como esse fluxo opera
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
              {journey.steps.map((step, index) => (
                <li key={step.key} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{step.label}</p>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Valor do plano</p>
              <p className="mt-2">{membership.priceLabel}</p>
              <p className="mt-1 text-xs">Valor exibido no checkout mensal.</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Ciclo atual</p>
              <p className="mt-2">
                {membership.currentPeriodEndsAt
                  ? formatMemberDateTime(membership.currentPeriodEndsAt)
                  : "Aguardando confirmacao do pagamento."}
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

                <div className="mt-4 rounded-[20px] border border-border/70 bg-background/85 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Janela do PIX
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {effectiveChargeStatus === "created"
                      ? formatPixCountdown(secondsLeft)
                      : effectiveChargeStatus === "paid"
                        ? "Confirmado"
                        : "Encerrado"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {effectiveChargeStatus === "created"
                      ? "Tempo restante estimado para pagamento."
                      : latestCharge.expiresAt
                        ? `Referencia: ${formatMemberDateTime(latestCharge.expiresAt)}`
                        : "Sem cronometro ativo."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
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
                    <p className="mt-1 text-xs">Cobranca mensal emitida para esta conta.</p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Ultima atualizacao</p>
                    <p className="mt-2">{formatMemberDateTime(latestCharge.updatedAt)}</p>
                    <p className="mt-1 text-xs">Estado mais recente salvo pelo portal.</p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Emitido em</p>
                    <p className="mt-2">{formatMemberDateTime(latestCharge.createdAt)}</p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">Expira em</p>
                    <p className="mt-2">
                      {latestCharge.expiresAt
                        ? formatMemberDateTime(latestCharge.expiresAt)
                        : "Sem prazo registrado"}
                    </p>
                  </div>
                </div>

                {effectiveChargeStatus === "paid" ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                    Pagamento confirmado. Volte ao dashboard para emitir ou renovar a chave da API.
                  </div>
                ) : effectiveChargeStatus === "expired" ? (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
                    Essa cobranca encerrou a janela de pagamento. Gere um novo PIX para continuar.
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
                    Enquanto o pagamento nao for confirmado, o portal continua aguardando a
                    atualizacao da cobranca para liberar o acesso.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[28px] border border-dashed border-border/80 bg-background/70 p-6 text-center">
              <QrCode className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum PIX gerado ainda</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Gere a primeira cobranca para exibir QR Code, copia e cola, validade e estado do
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
