import { useMemo } from "react";
import {
  BookKey,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { getMemberStatusMeta, MEMBER_API_BASE_URL } from "@/lib/members";

const MembrosDashboardPage = () => {
  const { account, lastIssuedApiKey, rotateApiKey, clearIssuedApiKey, loading } = useMemberSession();

  const membership = account?.membership;
  const usage = account?.usage;
  const latestCharge = account?.latestCharge;
  const statusMeta = getMemberStatusMeta(membership?.status ?? "pending_checkout");
  const checklist = useMemo(
    () => [
      {
        label: "Login Google validado no backend",
        complete: Boolean(account?.user.googleSub),
      },
      {
        label: "Checkout PIX gerado",
        complete: latestCharge?.status === "created" || latestCharge?.status === "paid",
      },
      {
        label: "Pagamento confirmado",
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

    await navigator.clipboard.writeText(lastIssuedApiKey.plainTextKey);
    toast.success("API key copiada.");
  };

  if (!account || !membership || !usage) {
    return null;
  }

  return (
    <MemberPortalShell
      eyebrow="Painel do membro"
      title={`Bem-vindo, ${account.user.name.split(" ")[0] ?? "membro"}.`}
      intro="Aqui centralizamos status do plano, uso mensal, checkout atual e a geracao da API key unica do membro."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Plano</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{membership.priceLabel}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{membership.planName}</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Limite mensal
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            {usage.limit.toLocaleString("pt-BR")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {usage.used.toLocaleString("pt-BR")} usados no mes atual.
          </p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Ritmo tecnico</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            {membership.perSecondLimit} req/s
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Camada publica protegida por quota e chave unica.</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <BookKey className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Base da API</p>
          <h2 className="mt-2 break-all text-lg font-bold text-foreground">{MEMBER_API_BASE_URL}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Dominio liberado para membros ativos.</p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Estado da assinatura
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">{statusMeta.label}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{statusMeta.description}</p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Checklist atual</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      item.complete ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Periodo ativo</p>
              <p className="mt-2">
                {membership.currentPeriodEndsAt
                  ? new Date(membership.currentPeriodEndsAt).toLocaleString("pt-BR")
                  : "Ainda sem pagamento confirmado."}
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Saldo mensal</p>
              <p className="mt-2">{usage.remaining.toLocaleString("pt-BR")} chamadas restantes.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6">
              <Link to="/membros/checkout">
                Ir para o checkout PIX
                <CreditCard className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
              <Link to="/membros/docs">Abrir documentacao oficial</Link>
            </Button>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Provisionamento
          </p>
          <h2 className="mt-3 text-xl font-bold text-foreground">Chave de API do membro</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A chave unica so pode ser gerada quando o pagamento estiver confirmado. A cada nova
            geracao, a chave anterior e revogada automaticamente.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Estado atual da chave</p>
            {account.apiKey.exists ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prefixo ativo: <span className="font-semibold text-foreground">{account.apiKey.prefix}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ultimo uso:{" "}
                  {account.apiKey.lastUsedAt
                    ? new Date(account.apiKey.lastUsedAt).toLocaleString("pt-BR")
                    : "Ainda sem uso."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma chave ativa gerada ate o momento.
              </p>
            )}
          </div>

          {membership.status === "active" ? (
            <Button
              type="button"
              onClick={() => void handleRotateApiKey()}
              disabled={loading}
              className="mt-4 h-11 w-full rounded-full"
            >
              <KeyRound className="h-4 w-4" />
              {account.apiKey.exists ? "Regerar chave de API" : "Gerar chave de API"}
            </Button>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-border/80 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              Assim que o PIX for confirmado, este painel libera a emissao da chave exclusiva do membro.
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
                Essa chave e mostrada no portal no momento da geracao. Guarde-a no seu integrador.
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            Status do checkout atual:{" "}
            <span className="font-semibold text-foreground">
              {latestCharge?.status ?? "nenhuma cobranca gerada"}
            </span>
          </div>
        </article>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosDashboardPage;
