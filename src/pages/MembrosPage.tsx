import {
  ArrowRight,
  BadgeCheck,
  BookKey,
  Bot,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { MEMBER_PLAN, PUSHINPAY_NOTICE } from "@/lib/members";

const highlights = [
  {
    icon: KeyRound,
    title: "Uma chave unica por membro",
    description:
      "Cada conta ativa gera sua propria chave de API no portal, com rotacao segura e revogacao da chave anterior.",
  },
  {
    icon: Bot,
    title: "Documentacao oficial focada em integracao",
    description:
      "Guias claros de autenticacao, limites, exemplos em cURL e leitura do contrato da camada publica.",
  },
  {
    icon: ShieldCheck,
    title: "Camada publica separada da API interna",
    description:
      "A area de membros reaproveita os services do Laravel principal sem alterar o contrato da API interna do site.",
  },
];

const onboardingSteps = [
  {
    step: "01",
    title: "Entrar com Google",
    description:
      "O login padrao Google e validado no backend antes da sessao do portal ser aberta.",
  },
  {
    step: "02",
    title: "Gerar o PIX mensal",
    description:
      "O checkout do plano mensal e criado no backend e gera QR Code e codigo copia e cola para pagamento de R$ 15.",
  },
  {
    step: "03",
    title: "Receber a chave da API",
    description:
      "Depois da confirmacao do pagamento, o membro pode gerar sua chave exclusiva diretamente no painel.",
  },
];

const membersFeatures = [
  "Plano unico de R$ 15 por mes, com checkout PIX mensal.",
  "Limite atual planejado de 5.000 requisicoes por usuario, por mes.",
  "Controle tecnico inicial de 1 requisicao por segundo.",
  "Acesso a noticias, rankings, viagens, perfil da Camara e dossie consolidado.",
];

const MembrosPage = () => {
  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="overflow-hidden rounded-[36px] border border-white/70 bg-card/92 shadow-elevated">
            <div className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
              <div className="relative overflow-hidden p-6 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_36%)]" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Area de membros
                  </div>

                  <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Acesso pago para quem vai integrar dados publicos com frequencia.
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Organizamos um fluxo proprio para membros com login Google, plano mensal em
                    PIX, documentacao oficial, webhook de pagamento e uma camada publica da API
                    focada em uso recorrente.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" className="h-12 rounded-full px-6">
                      <Link to="/membros/login">
                        Entrar com Google
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
                      <Link to="/membros/login" state={{ from: "/membros/docs" }}>
                        Ver docs da API
                        <BookKey className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {membersFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-[24px] border border-border/70 bg-white/85 px-4 py-4 text-sm leading-6 text-muted-foreground shadow-card"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70 bg-slate-950 p-6 text-slate-50 sm:p-8 lg:border-l lg:border-t-0">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Plano atual
                  </div>

                  <h2 className="mt-4 text-2xl font-bold">{MEMBER_PLAN.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {MEMBER_PLAN.description}
                  </p>

                  <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
                    <p className="text-sm uppercase tracking-[0.16em] text-slate-300">
                      Assinatura mensal
                    </p>
                    <p className="mt-3 text-4xl font-extrabold">{MEMBER_PLAN.priceLabel}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Checkout PIX mensal gerado pelo backend, com liberacao operacional apos confirmacao do pagamento.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                        Limite mensal
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                        Ritmo tecnico
                      </p>
                      <p className="mt-2 text-lg font-bold">{MEMBER_PLAN.perSecondLimit} req/s</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50">
                    <p className="font-semibold">Aviso obrigatorio sobre o processamento:</p>
                    <p className="mt-2">{PUSHINPAY_NOTICE}</p>
                  </div>

                  <Button
                    asChild
                    className="mt-6 h-12 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  >
                    <Link to="/membros/checkout">
                      Ir para o checkout PIX
                      <CreditCard className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card"
              >
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-card sm:p-7">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Onboarding do membro
              </p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                Fluxo desenhado para sair do cadastro e chegar na API com pouco atrito.
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {onboardingSteps.map((item) => (
                <article
                  key={item.step}
                  className="rounded-[26px] border border-border/70 bg-background/85 p-5"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MembrosPage;
