import {
  BookKey,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

import MemberPortalShell from "@/components/members/MemberPortalShell";
import { DEFAULT_MEMBER_PLAN, MEMBER_API_BASE_URL, MEMBER_PIX_EXPIRATION_MINUTES } from "@/lib/members";

const quickstartSteps = [
  "Entre no portal com a conta Google que vai administrar sua assinatura.",
  `Gere o checkout PIX do plano mensal e conclua o pagamento dentro da janela de ${MEMBER_PIX_EXPIRATION_MINUTES} minutos.`,
  "Abra o dashboard, emita sua chave individual da API e guarde-a em local seguro.",
  "Use a chave no header X-Api-Key e valide a integracao com o endpoint /v1/me.",
];

const contractItems = [
  {
    label: "Plano",
    value: DEFAULT_MEMBER_PLAN.name,
  },
  {
    label: "Assinatura",
    value: DEFAULT_MEMBER_PLAN.priceLabel,
  },
  {
    label: "Cota mensal",
    value: `${DEFAULT_MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")} requisicoes por conta`,
  },
  {
    label: "Ritmo inicial",
    value: `${DEFAULT_MEMBER_PLAN.perSecondLimit} requisicao por segundo por conta`,
  },
];

const endpointGroups = [
  {
    title: "Conta e saude do acesso",
    items: ["GET /v1/health", "GET /v1/me"],
  },
  {
    title: "Noticias e dossies",
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

const integrationRules = [
  "Use sempre a chave individual emitida no seu dashboard.",
  "Armazene a chave em cofre de segredos, variavel de ambiente ou integrador seguro.",
  "Valide a configuracao inicial com /v1/me antes de chamar endpoints maiores.",
  "Rotacione a chave quando houver troca de equipe ou suspeita de exposicao.",
];

const operationalNotes = [
  "O portal libera a chave da API somente depois da assinatura ativa.",
  "Cada conta trabalha com uma unica chave ativa por vez.",
  "O checkout PIX fica disponivel no proprio painel e pode ser renovado quando expira.",
];

const curlExamples = [
  `curl -i "${MEMBER_API_BASE_URL}/me" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_API_BASE_URL}/news" \\
  -H "X-Api-Key: SUA_CHAVE"`,
  `curl -i "${MEMBER_API_BASE_URL}/viagens/resumo" \\
  -H "X-Api-Key: SUA_CHAVE"`,
];

const MembrosDocsPage = () => {
  return (
    <MemberPortalShell
      eyebrow="Docs oficiais"
      title="Documentacao da API para membros pagos"
      intro="Esta pagina concentra o que o assinante precisa para operar com clareza: ativacao da conta, uso da chave, endpoints liberados e exemplos iniciais de integracao."
    >
      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Primeiros passos</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            O portal foi desenhado para que a conta siga uma ordem simples: entrar, ativar a
            assinatura, emitir a chave e validar a primeira chamada na API.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
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
              <p className="font-semibold text-foreground">Base da API</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">{MEMBER_API_BASE_URL}</p>
              <p className="mt-3">Header principal: X-Api-Key</p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Teste inicial recomendado</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">GET /v1/me</p>
              <p className="mt-3">Use essa chamada para confirmar chave, conta e liberacao do plano.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Contrato do plano</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Estes sao os pontos operacionais basicos do plano atual, do jeito que o membro precisa
            enxergar no dia a dia.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {contractItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground"
              >
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-2">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold text-foreground">O que acontece antes da chave</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {operationalNotes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <article className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <BookKey className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Endpoints liberados</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A camada de membros entrega um conjunto enxuto de recursos para consumo recorrente, com
            leitura publica e autenticacao por chave individual.
          </p>

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
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Boas praticas de integracao</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            O portal cuida da assinatura e da emissao da chave. Do lado da integracao, o ideal e
            manter o consumo o mais previsivel possivel.
          </p>

          <div className="mt-5 rounded-[24px] border border-border/70 bg-background/85 p-4">
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {integrationRules.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-900/10 bg-slate-950 p-5 text-slate-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Leitura de produto
            </p>
            <p className="mt-3 text-lg font-semibold">O portal existe para orientar a conta.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              O foco aqui e dar ao membro uma trilha clara para ativar, testar e manter a
              integracao, sem desviar a atencao para detalhes que nao ajudam no uso do produto.
            </p>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <TerminalSquare className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">Exemplos oficiais em cURL</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Use estes exemplos como ponto de partida. O fluxo recomendado e validar a chave em{" "}
          <span className="font-medium text-foreground">/v1/me</span> e depois seguir para os
          recursos da sua operacao.
        </p>

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
