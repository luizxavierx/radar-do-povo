import {
  ArrowRight,
  BadgeCheck,
  BookKey,
  CreditCard,
  Gauge,
  KeyRound,
  LockKeyhole,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { MEMBER_PLAN, PUSHINPAY_NOTICE } from "@/lib/members";

const heroHighlights = [
  {
    icon: LockKeyhole,
    title: "Login e conta",
    description: "Acesso com Google e sessao centralizada no portal de membros.",
  },
  {
    icon: CreditCard,
    title: "Assinatura mensal",
    description: "Checkout PIX com confirmacao refletida direto no painel.",
  },
  {
    icon: KeyRound,
    title: "API individual",
    description: "Uma chave ativa por conta para consumir a camada publica.",
  },
];

const featureCards = [
  {
    icon: LayoutDashboard,
    title: "Portal organizado para operacao recorrente",
    description:
      "Tudo o que o membro precisa fica no mesmo lugar: assinatura, uso mensal, checkout, chave ativa e documentacao.",
  },
  {
    icon: KeyRound,
    title: "Chave individual por conta",
    description:
      "Cada membro opera com a propria chave de API. Ao gerar uma nova, a anterior e revogada automaticamente.",
  },
  {
    icon: ShieldCheck,
    title: "Camada publica independente da API interna",
    description:
      "A experiencia comercial fica separada do consumo interno da plataforma, sem misturar contratos nem acessos.",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Entrar com Google",
    description: "A conta e autenticada e o portal prepara seu acesso sem exigir senha nova.",
  },
  {
    step: "02",
    title: "Ativar via PIX",
    description: "O checkout mensal e gerado no painel com QR Code e codigo copia e cola.",
  },
  {
    step: "03",
    title: "Gerar a chave da API",
    description: "Assim que o pagamento for confirmado, a chave individual fica disponivel no dashboard.",
  },
];

const planIncludes = [
  "Ate 5.000 requisicoes por mes por conta.",
  "Limite tecnico inicial de 1 requisicao por segundo.",
  "Acesso aos endpoints de noticias, dossie, viagens e rankings.",
  "Portal para checkout, renovacao, documentacao e emissao da chave.",
];

const saasSignals = [
  {
    icon: LayoutDashboard,
    label: "Portal unificado",
    value: "Conta, billing e API",
  },
  {
    icon: Gauge,
    label: "Operacao previsivel",
    value: "Cota e status no painel",
  },
  {
    icon: ShieldCheck,
    label: "Contrato separado",
    value: "API publica sem misturar a interna",
  },
];

const MembrosPage = () => {
  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1220px] px-4 pb-12 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="overflow-hidden rounded-[36px] border border-white/70 bg-card/95 shadow-elevated">
            <div className="grid gap-0 xl:grid-cols-[1.12fr_0.88fr]">
              <div className="relative overflow-hidden p-6 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_40%)]" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Radar do Povo Membros
                  </div>

                  <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Um portal de membros mais simples para assinar, autenticar e integrar a API.
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    A area de membros foi organizada como um produto SaaS: onboarding claro,
                    assinatura mensal em PIX, documentacao oficial e painel de conta sem ruido
                    operacional.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" className="h-12 rounded-full px-6">
                      <Link to="/membros/login">
                        Entrar na area de membros
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
                      <Link to="/membros/login" state={{ from: "/membros/docs" }}>
                        Ver documentacao
                        <BookKey className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {heroHighlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[24px] border border-border/70 bg-white/88 px-4 py-4 shadow-card"
                      >
                        <div className="inline-flex rounded-2xl bg-primary/10 p-2.5 text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70 bg-slate-950 p-6 text-slate-50 sm:p-8 xl:border-l xl:border-t-0">
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Plano mensal
                  </div>

                  <h2 className="mt-4 text-2xl font-bold">{MEMBER_PLAN.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{MEMBER_PLAN.description}</p>

                  <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                      Investimento
                    </p>
                    <p className="mt-3 text-4xl font-extrabold">{MEMBER_PLAN.priceLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Assinatura mensal com checkout em PIX e ativacao do acesso dentro do proprio
                      portal.
                    </p>
                  </div>

                  <div className="mt-5 space-y-2 text-sm leading-6 text-slate-200">
                    {planIncludes.map((item) => (
                      <div
                        key={item}
                        className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {saasSignals.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[20px] border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <div className="inline-flex rounded-xl bg-white/10 p-2 text-white">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="mt-6 h-12 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  >
                    <Link to="/membros/login">
                      Comecar agora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {featureCards.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-card"
              >
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-card sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Como funciona
              </p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                Da conta criada ate a primeira chamada na API, sem etapas confusas.
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {journeySteps.map((item) => (
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
            </article>

            <article className="rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-card sm:p-7">
              <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                Checkout e operacao do membro
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                O portal foi organizado para deixar claro o que esta pendente, o que ja foi pago e
                qual chave esta ativa na conta.
              </p>

              <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-5">
                <p className="text-sm font-semibold text-foreground">O que o membro acompanha</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Status da assinatura e do ciclo atual.</li>
                  <li>Checkout PIX em aberto, pago, expirado ou renovado.</li>
                  <li>Consumo mensal da cota e disponibilidade de chamadas.</li>
                  <li>Geracao e rotacao da chave individual da API.</li>
                </ul>
              </div>

              <div className="mt-5 rounded-[24px] border border-border/70 bg-slate-950 p-5 text-slate-50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Linguagem do produto
                </p>
                <p className="mt-3 text-lg font-semibold">
                  Um portal de membros mais proximo de um SaaS do que de uma tela tecnica.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A proposta aqui e deixar o membro sempre sabendo onde esta no fluxo: entrar,
                  ativar, acompanhar e integrar.
                </p>
              </div>

              <p className="mt-5 text-xs leading-6 text-muted-foreground">{PUSHINPAY_NOTICE}</p>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MembrosPage;
