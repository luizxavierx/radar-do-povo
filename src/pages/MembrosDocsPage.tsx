import { CreditCard, Link2, ShieldCheck, TerminalSquare } from "lucide-react";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import {
  DEFAULT_MEMBER_PLAN,
  MEMBER_API_BASE_URL,
  MEMBER_PORTAL_BASE_URL,
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

const portalEndpoints = [
  "POST /auth/google",
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
  `curl -i "${MEMBER_PORTAL_BASE_URL}/billing/pix" \\
  -H "Authorization: Bearer SUA_SESSAO_DO_PORTAL" \\
  -H "Content-Type: application/json" \\
  -d '{}'`,
];

const billingChecklist = [
  "Login Google verificado no backend por audience do client ID.",
  "Checkout PIX criado server-side com token da PushinPay protegido.",
  "Webhook atualiza o status da cobranca e ativa o acesso mensal.",
  "Membro ativo gera ou rotaciona sua API key unica dentro do portal.",
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
      intro="Esta area concentra o contrato da camada publica de membros e do portal de assinatura: autenticacao, limites, checkout PIX, webhook e emissao da API key."
    >
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Contrato base</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Base URL da API paga:{" "}
              <span className="font-semibold text-foreground">{MEMBER_API_BASE_URL}</span>
            </p>
            <p>
              Base URL do portal:{" "}
              <span className="font-semibold text-foreground">{MEMBER_PORTAL_BASE_URL}</span>
            </p>
            <p>
              Header padrao da API: <span className="font-semibold text-foreground">X-Api-Key</span>
            </p>
            <p>
              Plano atual:{" "}
              <span className="font-semibold text-foreground">{DEFAULT_MEMBER_PLAN.priceLabel}</span>
            </p>
            <p>
              Limites por usuario:{" "}
              <span className="font-semibold text-foreground">
                {DEFAULT_MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")} por mes e{" "}
                {DEFAULT_MEMBER_PLAN.perSecondLimit} req/s
              </span>
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Leitura operacional</p>
            <p className="mt-2">
              O portal comercial e a API paga reaproveitam os services do backend Laravel
              principal. Isso evita duplicacao de regra e mantem a camada de membros alinhada com
              os dados da plataforma.
            </p>
            <p className="mt-3">
              O login Google usa Google Identity Services com callback no navegador. Em producao,
              o ajuste obrigatorio no Google Cloud e liberar os dominios do frontend em
              <span className="font-semibold text-foreground"> Authorized JavaScript Origins</span>,
              nao configurar redirect URI para esse fluxo.
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
            <p className="font-semibold text-foreground">Rotas internas do portal</p>
            <ul className="mt-3 space-y-2">
              {portalEndpoints.map((endpoint) => (
                <li key={endpoint} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  {endpoint}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-[24px] border border-amber-300/60 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Aviso obrigatorio sobre a PUSHIN PAY</p>
            <p className="mt-2">{PUSHINPAY_NOTICE}</p>
            <p className="mt-3">
              Em producao, o webhook deve operar com URL e segredo configurados. Sem isso, o
              backend deve falhar fechado e nao ativar acesso pago.
            </p>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
          <h2 className="text-2xl font-bold text-foreground">Autenticacao e emissao da chave</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Portal</p>
              <p className="mt-2">
                O frontend carrega uma sessao do portal via Google e recebe um token proprio de
                sessao para operar checkout, consulta do membro e rotacao da API key.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">API paga</p>
              <p className="mt-2">
                Cada usuario opera com sua propria API key. O header principal e{" "}
                <span className="font-semibold text-foreground">X-Api-Key</span>. A chave antiga e
                revogada automaticamente quando o membro gera uma nova.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Quota e vigencia</p>
              <p className="mt-2">
                O acesso depende de pagamento confirmado, vigencia mensal ativa e cota mensal ainda
                disponivel para o usuario.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-card">
        <h2 className="text-2xl font-bold text-foreground">Contrato esperado do checkout PIX</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          O endpoint de billing abstrai a PushinPay e devolve ao portal apenas os campos
          necessarios para renderizar o checkout com seguranca, sem expor credenciais no navegador.
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
