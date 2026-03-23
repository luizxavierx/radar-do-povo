import { BookKey, CreditCard, Link2, ShieldCheck, TerminalSquare } from "lucide-react";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import {
  DEFAULT_MEMBER_PLAN,
  MEMBER_API_BASE_URL,
  MEMBER_PORTAL_BASE_URL,
  PUSHINPAY_NOTICE,
} from "@/lib/members";

const quickstartSteps = [
  "Entre no portal com sua conta Google.",
  "Ative a assinatura mensal pelo checkout PIX.",
  "Gere a chave da API no dashboard e use o header X-Api-Key.",
];

const endpointGroups = [
  {
    title: "Conta e status",
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

const portalEndpoints = [
  "GET /auth/google/redirect",
  "GET /auth/google/callback",
  "GET /me",
  "POST /billing/pix",
  "GET /billing/pix/current",
  "POST /api-key/rotate",
];

const curlExamples = [
  `curl -i "${MEMBER_API_BASE_URL}/me" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_API_BASE_URL}/politicos/arthur%20lira/camara" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_PORTAL_BASE_URL}/billing/pix/current" \\
  -H "Cookie: radar_member_portal=SEU_COOKIE_DE_SESSAO"`,
];

const pixResponseFields = [
  "id: identificador unico da cobranca no provider.",
  "qrCode: codigo PIX completo no padrao copia e cola.",
  "status: estado atual da transacao, como created, paid ou expired.",
  "value: valor da cobranca em centavos.",
  "qrCodeBase64: imagem do QR Code pronta para exibicao.",
  "webhookUrl: URL configurada para receber atualizacoes da cobranca.",
];

const MembrosDocsPage = () => {
  return (
    <MemberPortalShell
      eyebrow="Docs oficiais"
      title="Documentacao da API para membros pagos"
      intro="Aqui fica o contrato operacional da area de membros: acesso ao portal, ativacao por PIX, geracao da chave e leitura dos endpoints liberados."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Quickstart</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            O portal foi pensado para um onboarding curto: autenticar, ativar a assinatura e
            começar a consumir a API publica com uma chave por conta.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Passos essenciais</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              {quickstartSteps.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Base URL da API</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">{MEMBER_API_BASE_URL}</p>
              <p className="mt-3">Header principal: X-Api-Key</p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Portal de membros</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                {MEMBER_PORTAL_BASE_URL}
              </p>
              <p className="mt-3">Sessao mantida por cookie seguro do portal.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Contrato base do plano</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Plano atual</p>
              <p className="mt-2">{DEFAULT_MEMBER_PLAN.name}</p>
              <p className="mt-1">{DEFAULT_MEMBER_PLAN.priceLabel}</p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Limites</p>
              <p className="mt-2">
                {DEFAULT_MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")} requests por mes
              </p>
              <p className="mt-1">{DEFAULT_MEMBER_PLAN.perSecondLimit} req/s por conta</p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground md:col-span-2">
              <p className="font-semibold text-foreground">Leitura operacional</p>
              <p className="mt-2">
                A camada de membros reutiliza os services do backend principal e expõe um contrato
                mais enxuto para clientes pagantes, sem alterar a API interna do site.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <BookKey className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Endpoints liberados</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {endpointGroups.map((group) => (
              <section
                key={group.title}
                className="rounded-[24px] border border-border/70 bg-background/85 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Portal e pagamento</h2>
          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Rotas internas do portal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {portalEndpoints.map((endpoint) => (
                <li key={endpoint} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  {endpoint}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">Fluxo de ativacao</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>O portal cria o checkout PIX pelo backend.</li>
              <li>O pagamento confirmado atualiza a cobranca e libera o plano.</li>
              <li>Com a conta ativa, o membro pode gerar a chave unica da API.</li>
            </ul>
          </div>

          <div className="mt-5 rounded-[24px] border border-amber-300/60 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Aviso obrigatorio sobre a PUSHIN PAY</p>
            <p className="mt-2">{PUSHINPAY_NOTICE}</p>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
        <h2 className="text-2xl font-bold text-foreground">Contrato esperado do checkout PIX</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          O portal recebe apenas os dados necessarios para renderizar o checkout e acompanhar o
          status da cobranca, sem expor credenciais do provider ao navegador.
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

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
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
