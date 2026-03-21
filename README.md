# API Radar do Povo (Laravel + GraphQL)

API GraphQL para dados de politicos, gastos publicos, viagens e emendas, com composicao de dados do PostgreSQL (Amazon RDS) e APIs externas, usando Redis como cache obrigatorio.

Inclui campos detalhados para:
- `viagens` + `passagens` + `pagamentos` + `trechos`
- `emendas` + `emendas_convenios` + `emendas_por_favorecido`
- `topGastadoresEmendas` (ranking de autores de emenda por valores agregados)
- `topEmendasPorPais` (ranking agregado de emendas por pais)
- fontes externas consolidadas em `perfilExterno`: `camara`, `senado`, `tse`, `lexml`, `brasilIo`, `wikipedia`

## Arquitetura

Fluxo de responsabilidade:

`GraphQL Resolvers -> Services -> Repositories (PostgreSQL) -> External Providers`

Estrutura implementada:

- `app/GraphQL`: schema, queries, resolvers, scalars e error handlers
- `app/Services`: orquestracao e regras de negocio
- `app/Repositories`: acesso isolado ao PostgreSQL
- `app/Providers/External`: consumo de APIs externas (timeout/retry/cache)
- `app/Cache`: fabrica de chaves de cache
- `app/Http/Middleware`: request id + logging estruturado
- `app/Services/HealthService.php`: healthcheck consolidado
- `database/sql`: scripts SQL de performance

## Stack

- PHP 8.3
- Laravel 11
- Lighthouse GraphQL
- PostgreSQL (Amazon RDS)
- Redis (cache)

## Endpoints

- `POST /graphql`
- `GET /healthz` (health rapido do framework)
- `GET /api/healthz` (health detalhado: db/redis)
- `GET /api/metrics` (formato Prometheus simples)

## Configuracao de ambiente

Use o arquivo:

- [`.env.example`](/Users/Note%20LG/Downloads/Api-radar/.env.example)

Pontos importantes:

- Porta da API: `APP_PORT=8081`
- RDS com SSL: `DB_SSLMODE=verify-full` e `DB_SSL_ROOT_CERT=/certs/global-bundle.pem`
- Cache obrigatorio em Redis: `CACHE_STORE=redis`
- Brasil.IO e opcional e exige token: `BRASILIO_TOKEN=...`

Fontes externas configuradas:
- Camara: `https://dadosabertos.camara.leg.br`
- Senado: `https://legis.senado.leg.br/dadosabertos`
- TSE (referencias oficiais): `https://dadosabertos.tse.jus.br`
- LexML busca: `https://www.lexml.gov.br/busca/search`
- Brasil.IO (opcional): `https://brasil.io`

## Subida na EC2 (Ubuntu)

1. Instalar dependencias base:

```bash
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh
```

2. Preparar app:

```bash
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan lighthouse:cache
```

3. Subir na porta `8081`:

```bash
chmod +x scripts/start-api.sh
APP_PORT=8081 ./scripts/start-api.sh
```

## Query GraphQL de teste

```graphql
query PoliticoCompleto($id: ID!) {
  politico(id: $id) {
    id
    nomeCanonico
    partido
    uf
    gastos(filtro: { anoInicio: 2023, anoFim: 2025 }) {
      totalViagens
      totalPagamentosCents
      totalPassagensCents
    }
    perfilExterno {
      camara {
        nome
        siglaPartido
      }
      senado {
        nome
        siglaPartido
      }
      tse {
        datasetCandidatosUrl
      }
      lexml {
        total
      }
      wikipedia {
        titulo
        url
      }
    }
  }
}
```

## Queries de ranking para o site

```graphql
query TopGastadores {
  topGastadoresEmendas(
    filtro: { anoInicio: 2019, anoFim: 2026 }
    pagination: { limit: 30, offset: 0 }
  ) {
    total
    nodes {
      codigoAutorEmenda
      nomeAutorEmenda
      totalEmendas
      totalPagoCents
      totalEmpenhadoCents
      totalLiquidadoCents
    }
  }
}
```

```graphql
query TopPorPais {
  topEmendasPorPais(
    filtro: { anoInicio: 2019, anoFim: 2026 }
    pagination: { limit: 30, offset: 0 }
  ) {
    total
    nodes {
      pais
      totalEmendas
      totalPagoCents
      totalEmpenhadoCents
      totalLiquidadoCents
    }
  }
}
```

## Performance e escalabilidade

- Cache Redis em consultas caras e respostas agregadas.
- Providers externos com `timeout + retry curto + cache`.
- Batch loader por request para `Politico.gastos` (reduz N+1).
- SQL orientado para agregacao e filtros por periodo.
- Evitar query GraphQL monolitica com multiplos niveis em `limit` alto; paginar em camadas.
- Para dados completos, usar paginação incremental (`offset`) em `viagens`, `emendas` e subcolecoes.
- Script de indices extras:
  - [`database/sql/001_performance_indexes.sql`](/Users/Note%20LG/Downloads/Api-radar/database/sql/001_performance_indexes.sql)

## Documentacao adicional

- [Arquitetura](/Users/Note%20LG/Downloads/Api-radar/docs/ARCHITECTURE.md)
- [Deploy EC2 Ubuntu](/Users/Note%20LG/Downloads/Api-radar/docs/DEPLOY_EC2_UBUNTU.md)
- [Testes GraphQL](/Users/Note%20LG/Downloads/Api-radar/docs/GRAPHQL_TESTS.md)
- [Systemd Service](/Users/Note%20LG/Downloads/Api-radar/docs/SYSTEMD_SERVICE.md)
