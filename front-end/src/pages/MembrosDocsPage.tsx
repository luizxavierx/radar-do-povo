import { CreditCard, Link2, ShieldCheck, TerminalSquare } from "lucide-react";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import {
  MEMBER_API_BASE_URL,
  MEMBER_PLAN,
  PUSHINPAY_NOTICE,
} from "@/lib/members";

const endpointGroups = [
  {
    title: "Infra e conta",
    items: ["GET /v1/health", "GET /v1/me"],
  },
  {
    title: "Noticias e dossie",
    items: [
      "GET /v1/news",
      "GET /v1/politicos/{idOrNome}/camara",
      "GET /v1/politicos/{idOrNome}/dossie",
    ],
  },
  {
    title: "Viagens",
    items: [
      "GET /v1/viagens",
      "GET /v1/viagens/resumo",
      "GET /v1/viagens/top-viajantes",
      "GET /v1/viagens/top-gastadores",
    ],
  },
  {
    title: "Rankings de emendas",
    items: [
      "GET /v1/emendas/rankings/resumo",
      "GET /v1/emendas/rankings/serie-anual",
      "GET /v1/emendas/rankings/top-gastadores",
      "GET /v1/emendas/rankings/top-paises",
      "GET /v1/emendas/rankings/top-tipos",
    ],
  },
];

const curlExamples = [
  `curl -i "${MEMBER_API_BASE_URL}/me" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_API_BASE_URL}/politicos/arthur%20lira/camara" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_API_BASE_URL}/emendas/rankings/resumo?anoInicio=2025&anoFim=2025" \\
  -H "X-Api-Key: SUA_CHAVE"`,
];

const billingChecklist = [
  "Login inicial feito com Google para reduzir atrito de cadastro.",
  "Checkout PIX mensal de R$ 15 por meio de endpoint server-side.",
  "Liberacao da API key unica do membro apos confirmacao do pagamento.",
];

const pixResponseFields = [
  "id: identificador unico da cobranca gerada.",
  "qr_code: codigo PIX completo no padrao copia e cola.",
  "status: estado da transacao, como created, paid ou expired.",
  "value: valor da cobranca em centavos.",
  "qr_code_base64: imagem do QR Code pronta para exibicao.",
  "webhook_url: URL configurada para receber atualizacoes da cobranca.",
];

const MembrosDocsPage = () => {
  return (
    <MemberPortalShell
      eyebrow="Docs oficiais"
      title="Documentacao da API para membros pagos"
      intro="Esta area concentra o contrato inicial da camada publica de membros: autenticacao, limites, grupos de endpoint, fluxo de cobranca e exemplos prontos de integracao."
    >
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Contrato base</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Base URL recomendada:{" "}
              <span className="font-semibold text-foreground">{MEMBER_API_BASE_URL}</span>
            </p>
            <p>
              Header padrao: <span className="font-semibold text-foreground">X-Api-Key</span>
            </p>
            <p>
              Plano atual:{" "}
              <span className="font-semibold text-foreground">{MEMBER_PLAN.priceLabel}</span>
            </p>
            <p>
              Limites por usuario:{" "}
              <span className="font-semibold text-foreground">
                {MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")} por mes e{" "}
                {MEMBER_PLAN.perSecondLimit} req/s
              </span>
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Leitura operacional</p>
            <p className="mt-2">
              A camada publica de membros reaproveita os mesmos services da API principal. Isso
              reduz duplicacao de regra e mantem o recorte exposto aos membros alinhado com os
              dados que a plataforma interna ja consome.
            </p>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Grupos de endpoint liberados</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {endpointGroups.map((group) => (
              <section
                key={group.title}
                className="rounded-[24px] border border-border/70 bg-background/85 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="break-words rounded-2xl bg-white px-3 py-2 shadow-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Fluxo de pagamento mensal</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            {billingChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">PushinPay no frontend</p>
            <p className="mt-2">
              O navegador nunca deve chamar o token da PushinPay diretamente. O front precisa falar
              com um endpoint server-side proprio, que cria o PIX com valor de{" "}
              <span className="font-semibold text-foreground">{MEMBER_PLAN.priceCents}</span>{" "}
              centavos e devolve o QR Code para exibicao.
            </p>
          </div>

          <div className="mt-5 rounded-[24px] border border-amber-300/60 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Aviso obrigatorio sobre a PUSHIN PAY</p>
            <p className="mt-2">{PUSHINPAY_NOTICE}</p>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <h2 className="text-2xl font-bold text-foreground">Notas de autenticacao e quota</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Autenticacao</p>
              <p className="mt-2">
                Cada usuario opera com sua propria API key. O header principal e{" "}
                <span className="font-semibold text-foreground">X-Api-Key</span>. A chave pode
                entrar tambem em Bearer, quando essa opcao estiver habilitada no backend.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Janela de acesso</p>
              <p className="mt-2">
                O acesso depende de status ativo, validade do plano e cota disponivel no mes
                corrente.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Headers de quota</p>
              <p className="mt-2">
                A camada de membros pode devolver limite mensal, uso acumulado, saldo restante e
                referencia do mes em headers de resposta para facilitar observabilidade do cliente.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
        <h2 className="text-2xl font-bold text-foreground">Contrato esperado do checkout PIX</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          O endpoint server-side de billing deve abstrair a PushinPay, mas devolver ao frontend os
          campos necessarios para renderizar a cobranca sem scrap nem polling improvisado.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {pixResponseFields.map((field) => (
            <div
              key={field}
              className="rounded-[24px] border border-border/70 bg-background/85 px-4 py-4 text-sm leading-6 text-muted-foreground"
            >
              {field}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <TerminalSquare className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">Exemplos oficiais em cURL</h2>
        <div className="mt-5 space-y-4">
          {curlExamples.map((example) => (
            <pre
              key={example}
              className="overflow-x-auto rounded-[24px] border border-slate-800/80 bg-slate-950 p-4 text-xs leading-6 text-slate-100"
            >
              <code>{example}</code>
            </pre>
          ))}
        </div>
      </section>
    </MemberPortalShell>
  );
};

export default MembrosDocsPage;
