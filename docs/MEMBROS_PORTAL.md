# Portal de Membros

## Objetivo

O portal de membros do Radar do Povo concentra o fluxo comercial e tecnico da camada publica da API dentro da mesma app Laravel da API principal, sem alterar o contrato interno usado pelo site.

Hoje o fluxo integrado cobre:

- login inicial com Google, validado no backend
- sessao propria do portal para checkout e painel do membro
- checkout PIX mensal criado server-side via PushinPay
- webhook autenticado para ativar o plano
- geracao e rotacao da API key unica do membro
- documentacao oficial da API paga

## Plano atual

- nome: `Radar do Povo Membros`
- preco: `R$ 15/mensal`
- modelo: assinatura mensal via PIX
- limite mensal inicial: `5.000 requisicoes por usuario`
- limite tecnico inicial: `1 req/s por usuario`

## Rotas do frontend

- `/membros`
- `/membros/login`
- `/membros/dashboard`
- `/membros/checkout`
- `/membros/docs`

## Rotas do portal no backend

Base padrao:

```txt
https://api.radardopovo.com/api/member/portal
```

Rotas principais:

- `POST /auth/google`
- `POST /auth/logout`
- `GET /me`
- `POST /billing/pix`
- `GET /billing/pix/current`
- `POST /billing/pushinpay/webhook`
- `POST /api-key/rotate`

## Fluxo real de producao

1. O usuario entra com Google no frontend.
2. O frontend envia a `credential` para `POST /auth/google`.
3. O backend valida a credencial no Google TokenInfo, confere `audience`, `issuer` e `email_verified`.
4. O backend cria ou atualiza o usuario em `users` e abre uma sessao do portal.
5. O membro gera o checkout PIX em `POST /billing/pix`.
6. O Laravel cria a cobranca na PushinPay e devolve QR Code, copia e cola e status.
7. A PushinPay chama o webhook configurado quando o pagamento muda de estado.
8. Ao receber a primeira transicao real para `paid`, o backend ativa o acesso mensal do usuario.
9. O membro ativo gera ou rotaciona sua API key em `POST /api-key/rotate`.

## Google em producao

Este fluxo usa Google Identity Services com callback no navegador, nao OAuth por redirecionamento classico.

Por isso, no Google Cloud Console, o ponto obrigatorio e:

- configurar `Authorized JavaScript Origins` com os dominios reais do frontend
- usar o mesmo `CLIENT_ID` no frontend e no backend

Nao depende de `redirect URI` para abrir a sessao do portal.

## Variaveis de ambiente do backend

```env
MEMBER_PORTAL_ROUTE_PREFIX=api/member/portal
MEMBER_PORTAL_SESSION_HEADER=X-Member-Portal-Token
MEMBER_PORTAL_BEARER_ENABLED=true
MEMBER_PORTAL_SESSION_TTL_HOURS=720
MEMBER_PORTAL_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
MEMBER_PORTAL_GOOGLE_TOKENINFO_URL=https://oauth2.googleapis.com/tokeninfo
MEMBER_PORTAL_PLAN_SLUG=membros-radar-mensal
MEMBER_PORTAL_PLAN_NAME="Radar do Povo Membros"
MEMBER_PORTAL_PLAN_PRICE_CENTS=1500
MEMBER_PORTAL_PLAN_PRICE_LABEL="R$ 15/mensal"
MEMBER_PORTAL_PLAN_MONTHLY_REQUEST_LIMIT=5000
MEMBER_PORTAL_PLAN_PER_SECOND_LIMIT=1
PUSHINPAY_BASE_URL=https://api.pushinpay.com.br/api
PUSHINPAY_TOKEN=seu-token
PUSHINPAY_WEBHOOK_URL=https://api.radardopovo.com/api/member/portal/billing/pushinpay/webhook
PUSHINPAY_WEBHOOK_SECRET_HEADER=X-Radar-Webhook-Secret
PUSHINPAY_WEBHOOK_SECRET=segredo-forte
PUSHINPAY_TIMEOUT_SECONDS=15
```

## Variaveis de ambiente do frontend

```env
VITE_MEMBER_API_BASE_URL=https://abertos.radardopovo.com/v1
VITE_MEMBER_PORTAL_BASE_URL=https://api.radardopovo.com/api/member/portal
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_MEMBER_PORTAL_DEMO=false
```

## Integracao de cobranca

O navegador nao fala com a PushinPay diretamente. O token do provedor permanece apenas no Laravel.

O portal usa:

- `POST /billing/pix` para criar ou recuperar a cobranca ativa
- `GET /me` para refletir o estado salvo do checkout
- `POST /billing/pushinpay/webhook` para confirmacao assincrona

Regras de seguranca assumidas por esta implementacao:

- `PUSHINPAY_WEBHOOK_URL` deve estar configurada
- `PUSHINPAY_WEBHOOK_SECRET` deve estar configurado
- o webhook deve falhar fechado quando esse segredo estiver ausente
- o plano so deve ser ativado na primeira transicao real para `paid`

Payload esperado pelo frontend:

```json
{
  "id": "uuid-da-cobranca",
  "status": "created",
  "value": 1500,
  "qrCode": "codigo-pix-copia-e-cola",
  "qrCodeBase64": "data:image/png;base64,...",
  "webhookUrl": "https://api.radardopovo.com/api/member/portal/billing/pushinpay/webhook"
}
```

## API key do membro

- cada usuario possui apenas uma API key ativa por vez
- ao gerar uma nova, a anterior e revogada
- a chave em texto puro e mostrada no portal somente no momento da geracao
- o backend armazena apenas o hash da chave em `member_api_keys`
- a API publica so deve responder para usuarios com janela de acesso ativa

## Aviso obrigatorio

O checkout e a oferta devem exibir, antes da finalizacao do pagamento, o seguinte aviso:

> A PUSHIN PAY atua exclusivamente como processadora de pagamentos e nao possui qualquer responsabilidade pela entrega, suporte, conteudo, qualidade ou cumprimento das obrigacoes relacionadas aos produtos ou servicos oferecidos pelo vendedor.

## Superficie da API paga

Base padrao:

```txt
https://abertos.radardopovo.com/v1
```

Grupos iniciais de endpoint:

- `GET /v1/health`
- `GET /v1/me`
- `GET /v1/news`
- `GET /v1/politicos/{idOrNome}/camara`
- `GET /v1/politicos/{idOrNome}/dossie`
- `GET /v1/viagens`
- `GET /v1/viagens/resumo`
- `GET /v1/viagens/top-viajantes`
- `GET /v1/viagens/top-gastadores`
- `GET /v1/emendas/rankings/resumo`
- `GET /v1/emendas/rankings/serie-anual`
- `GET /v1/emendas/rankings/top-gastadores`
- `GET /v1/emendas/rankings/top-paises`
- `GET /v1/emendas/rankings/top-tipos`

Autenticacao:

- header principal: `X-Api-Key`
- `Bearer` opcional quando habilitado no backend de membros

## Estado atual da integracao

O portal ficou preparado para producao dentro da mesma app Laravel:

- login Google com verificacao server-side
- sessao do portal em tabela propria
- checkout PIX server-side
- webhook protegido por segredo obrigatorio em producao
- ativacao mensal do usuario apos pagamento
- emissao segura da API key sob demanda no painel
