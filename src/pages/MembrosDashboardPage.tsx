import { useMemo } from "react";
import {
  ArrowRight,
  BookKey,
  CheckCircle2,
  Copy,
  CreditCard,
  Gauge,
  KeyRound,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import {
  getMemberChargeStatusMeta,
  getMemberStatusMeta,
  MEMBER_API_BASE_URL,
} from "@/lib/members";

const MembrosDashboardPage = () => {
  const { account, lastIssuedApiKey, rotateApiKey, clearIssuedApiKey, loading } = useMemberSession();

  const membership = account?.membership;
  const usage = account?.usage;
  const latestCharge = account?.latestCharge;
  const statusMeta = getMemberStatusMeta(membership?.status ?? "pending_checkout");
  const chargeMeta = getMemberChargeStatusMeta(latestCharge?.status);

  const usagePercent = useMemo(() => {
    if (!usage || usage.limit <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  }, [usage]);

  const nextAction = useMemo(() => {
    if (membership?.status === "active") {
      return {
        title: "Conta pronta para integracao",
        description:
          "Sua assinatura esta ativa. Gere ou rotacione a chave da API sempre que precisar atualizar a integracao.",
        ctaLabel: "Gerenciar chave da API",
      };
    }

    if (latestCharge?.status === "created") {
      return {
        title: "Finalize o pagamento do PIX",
        description:
          "O checkout ja esta pronto. Assim que o pagamento for confirmado, a chave da API e liberada automaticamente.",
        ctaLabel: "Voltar ao checkout",
      };
    }

    return {
      title: "Ative sua assinatura",
      description:
        "O proximo passo e emitir o checkout PIX para iniciar a ativacao do plano mensal.",
      ctaLabel: "Gerar checkout",
    };
  }, [latestCharge?.status, membership?.status]);

  const checklist = useMemo(
    () => [
      {
        label: "Conta autenticada com Google",
        complete: Boolean(account?.user.googleSub),
      },
      {
        label: "Checkout emitido",
        complete: latestCharge?.status === "created" || latestCharge?.status === "paid",
      },
      {
        label: "Plano ativo para gerar chave",
        complete: membership?.status === "active",
      },
    ],
    [account?.user.googleSub, latestCharge?.status, membership?.status]
  );

  const handleRotateApiKey = async () => {
    try {
      const issued = await rotateApiKey();
      toast.success(`Nova chave emitida: ${issued.prefix}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar a chave agora.");
    }
  };

  const handleCopyPlainTextKey = async () => {
    if (!lastIssuedApiKey?.plainTextKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastIssuedApiKey.plainTextKey);
      toast.success("API key copiada.");
    } catch {
      toast.error("Nao foi possivel copiar a API key automaticamente.");
    }
  };

  if (!account || !membership || !usage) {
    return null;
  }

  return (
    <MemberPortalShell
      eyebrow="Painel do membro"
      title={`Bem-vindo, ${account.user.name.split(" ")[0] ?? "membro"}.`}
      intro="Seu painel agora concentra o que realmente importa para operar a assinatura: status do plano, consumo mensal, checkout atual e a chave individual da API."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Assinatura
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{membership.priceLabel}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{membership.planName}</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Status
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">{statusMeta.label}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusMeta.description}</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Gauge className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Cota disponivel
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            {usage.remaining.toLocaleString("pt-BR")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {usage.used.toLocaleString("pt-BR")} usados de {usage.limit.toLocaleString("pt-BR")} no
            mes atual.
          </p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Chave da API
          </p>
          <h2 className="mt-2 text-lg font-bold text-foreground">
            {account.apiKey.exists ? account.apiKey.prefix : "Ainda nao gerada"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {account.apiKey.exists
              ? "Existe uma chave ativa vinculada a esta conta."
              : "A chave fica disponivel assim que a conta estiver ativa."}
          </p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Visao geral da conta
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">{nextAction.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{nextAction.description}</p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Uso do mes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usage.used.toLocaleString("pt-BR")} de {usage.limit.toLocaleString("pt-BR")} chamadas
                </p>
              </div>
              <span className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs font-semibold text-foreground">
                {usagePercent}% consumido
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Plano</p>
              <p className="mt-2">{membership.planName}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Limite tecnico</p>
              <p className="mt-2">{membership.perSecondLimit} req/s por conta</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Base da API</p>
              <p className="mt-2 truncate font-mono text-xs text-slate-700">{MEMBER_API_BASE_URL}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Ciclo ativo</p>
              <p className="mt-2">
                {membership.currentPeriodEndsAt
                  ? new Date(membership.currentPeriodEndsAt).toLocaleString("pt-BR")
                  : "Ainda sem pagamento confirmado."}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Checkout atual</p>
              <p className="mt-2">{chargeMeta.label}</p>
              <p className="mt-2 text-xs">{chargeMeta.description}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Checklist do onboarding</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      item.complete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6">
              <Link to="/membros/checkout">
                {nextAction.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
              <Link to="/membros/docs">
                Abrir documentacao
                <BookKey className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Integracao
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">Gerencie sua chave da API</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A chave individual fica atrelada a esta conta. Quando uma nova for emitida, a anterior
            e invalidada automaticamente.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Estado atual</p>
            {account.apiKey.exists ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prefixo ativo:{" "}
                  <span className="font-semibold text-foreground">{account.apiKey.prefix}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ultimo uso:{" "}
                  {account.apiKey.lastUsedAt
                    ? new Date(account.apiKey.lastUsedAt).toLocaleString("pt-BR")
                    : "Ainda sem uso registrado."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma chave ativa foi gerada para esta conta ainda.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Base da API</p>
            <p className="mt-2 break-all font-mono text-xs text-slate-700">{MEMBER_API_BASE_URL}</p>
            <p className="mt-3">Header principal: X-Api-Key</p>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-900/10 bg-slate-950 p-4 text-slate-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Workspace do membro
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              O portal foi pensado para reduzir contexto espalhado: assinatura, checkout, docs e
              provisionamento da chave convivem na mesma conta.
            </p>
          </div>

          {membership.status === "active" ? (
            <Button
              type="button"
              onClick={() => void handleRotateApiKey()}
              disabled={loading}
              className="mt-4 h-12 w-full rounded-full"
            >
              <KeyRound className="h-4 w-4" />
              {account.apiKey.exists ? "Gerar nova chave" : "Gerar primeira chave"}
            </Button>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-border/80 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              Assim que o pagamento do plano for confirmado, o botao de emissao da chave fica
              disponivel aqui.
            </div>
          )}

          {lastIssuedApiKey ? (
            <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Nova chave emitida</p>
              <p className="mt-2 break-all rounded-2xl bg-white px-3 py-3 font-mono text-xs text-slate-900 shadow-sm">
                {lastIssuedApiKey.plainTextKey}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => void handleCopyPlainTextKey()}>
                  <Copy className="h-4 w-4" />
                  Copiar chave
                </Button>
                <Button type="button" variant="ghost" onClick={clearIssuedApiKey}>
                  Fechar exibicao
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-800">
                Essa chave aparece apenas no momento da geracao. Guarde-a no seu integrador.
              </p>
            </div>
          ) : null}
        </article>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosDashboardPage;
