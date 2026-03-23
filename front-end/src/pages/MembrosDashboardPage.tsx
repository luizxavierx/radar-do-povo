import {
  BookKey,
  CheckCircle2,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { getMemberStatusMeta, MEMBER_API_BASE_URL, MEMBER_PLAN } from "@/lib/members";

const checklist = [
  "Entrar com Google para registrar o perfil inicial do membro.",
  "Gerar o checkout PIX mensal de R$ 15.",
  "Confirmar o pagamento para liberar a chave unica da API.",
];

const MembrosDashboardPage = () => {
  const { session, pixCharge } = useMemberSession();
  const statusMeta = getMemberStatusMeta(session?.membershipStatus ?? "pending_checkout");

  return (
    <MemberPortalShell
      eyebrow="Painel do membro"
      title={`Bem-vindo, ${session?.name?.split(" ")[0] ?? "membro"}.`}
      intro="Aqui centralizamos o status do plano, o checkout PIX mensal, o dominio da API publica e o estado do provisionamento da chave do membro."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Plano</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{MEMBER_PLAN.priceLabel}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Assinatura mensal da area de membros.</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Limite mensal
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            {(session?.monthlyRequestLimit ?? MEMBER_PLAN.monthlyRequestLimit).toLocaleString(
              "pt-BR"
            )}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Requisicoes planejadas por usuario, por mes.</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Ritmo de uso</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            {session?.perSecondLimit ?? MEMBER_PLAN.perSecondLimit} req/s
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Controle tecnico inicial da camada publica.</p>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <BookKey className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.12em] text-muted-foreground">Base da API</p>
          <h2 className="mt-2 break-all text-lg font-bold text-foreground">{MEMBER_API_BASE_URL}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Dominio previsto para uso autenticado dos membros.</p>
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
              {checklist.map((item, index) => {
                const complete =
                  index === 0 ||
                  (index === 1 && session?.membershipStatus !== "pending_checkout") ||
                  (index === 2 && session?.membershipStatus === "active");

                return (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
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
            A emissao da chave unica do membro fica vinculada ao fluxo pago. O front ja esta pronto
            para receber esse dado assim que o backend de billing e provisionamento fechar o ciclo.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Status do checkout</p>
            {pixCharge ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cobranca atual: <span className="font-semibold text-foreground">{pixCharge.status}</span>
                </p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {pixCharge.id}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma cobranca PIX gerada ainda para esta sessao.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-dashed border-border/80 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            A chave mostrada para o membro deve aparecer aqui com mascara parcial e acao de copiar,
            assim que o backend retornar o provisionamento confirmado.
          </div>
        </article>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosDashboardPage;
