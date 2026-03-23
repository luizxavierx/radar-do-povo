# Portal de Membros

## Objetivo

O portal de membros do Radar do Povo concentra o fluxo comercial e tecnico da camada publica da API em uma experiencia unica no front:

- login inicial com Google
- checkout PIX mensal
- documentacao oficial da API de membros
- preparo para provisionamento de uma API key unica por usuario

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

## Fluxo esperado

1. O usuario entra com Google.
2. O frontend cria ou atualiza a sessao local do membro.
3. O membro gera o checkout PIX mensal.
4. O backend server-side cria a cobranca na PushinPay.
5. O frontend mostra QR Code, codigo copia e cola e referencia da cobranca.
6. Apos confirmacao do pagamento, o backend libera a API key unica do membro.

## Variaveis de ambiente do frontend

```env
VITE_MEMBER_API_BASE_URL=https://abertos.radardopovo.com/v1
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_MEMBER_PIX_MOCK=true
VITE_MEMBER_PIX_ENDPOINT=https://radardopovo.com/api/member/billing/pix
```

## Integracao de cobranca

O frontend nao deve expor o token da PushinPay. O navegador deve falar apenas com um endpoint proprio do Radar do Povo, por exemplo:

- `POST /api/member/billing/pix`

Esse endpoint server-side deve:

- receber o plano solicitado
- validar o usuario autenticado
- criar a cobranca PIX na PushinPay
- devolver para o front os campos necessarios para exibir o checkout

Payload minimo esperado no front:

```json
{
  "id": "uuid-da-cobranca",
  "qr_code": "codigo-pix-copia-e-cola",
  "status": "created",
  "value": 1500,
  "qr_code_base64": "data:image/png;base64,...",
  "webhook_url": "https://seu-dominio.com/webhooks/pushinpay"
}
```

## Aviso obrigatorio

O checkout e a oferta devem exibir, antes da finalizacao do pagamento, o seguinte aviso:

> A PUSHIN PAY atua exclusivamente como processadora de pagamentos e nao possui qualquer responsabilidade pela entrega, suporte, conteudo, qualidade ou cumprimento das obrigacoes relacionadas aos produtos ou servicos oferecidos pelo vendedor.

## Situacao atual do frontend

- login Google oficial preparado com fallback local de demonstracao
- checkout PIX pronto para mock ou endpoint server-side real
- dashboard com status do membro e estado do checkout
- documentacao oficial da API acessivel dentro da area de membros
- provisionamento da API key aguardando integracao final com o backend de billing
