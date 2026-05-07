# Arquitetura da API

## Camadas

1. `app/GraphQL`:
   - Recebe queries e delega.
   - Resolvers finos.
2. `app/Services`:
   - Orquestracao.
   - Politicas de cache.
3. `app/Repositories`:
   - SQL e acesso ao PostgreSQL.
4. `app/Providers/External`:
   - APIs externas com timeout/retry/cache.
   - Fontes atuais: Camara, Senado, TSE (referencias), LexML, Brasil.IO e Wikipedia.

## Regras operacionais aplicadas

- Nenhum resolver faz query direta no banco.
- Nenhum service acessa HTTP externo direto sem provider.
- Nenhum provider externo roda sem timeout/retry.
- Respostas caras usam Redis por default.

## N+1 e batching

- O campo `Politico.gastos` usa `ExpenseBatchLoader`.
- O loader agrupa IDs por request e chama `GastoService::batchSummaryByPoliticoIds`.

## Observabilidade

- `RequestIdMiddleware`: injeta `X-Request-ID`.
- `RequestLoggingMiddleware`: log estruturado com latencia/status.
- `HealthService`: monitora `db` e `redis`.
- `GET /api/metrics`: metrica basica em formato Prometheus.
