# Area de Viagens

## Endpoint

- GraphQL: `https://api.radardopovo.com/graphql`
- Metodo: `POST`
- Header: `Content-Type: application/json`

## Objetivo da area

A area de viagens foi pensada para o front conseguir montar:

- KPIs globais de viagens
- tabela paginada de viagens
- ranking de pessoas com mais viagens
- ranking de pessoas que mais gastaram com viagens
- ranking de orgaos superiores
- ranking de orgaos solicitantes
- recorte parlamentar geral, deputados e senadores
- detalhe de cada viagem com passagens, pagamentos e trechos

## Filtro oficial

Input principal:

```graphql
input RankingViagemFiltroInput {
  anoInicio: Int
  anoFim: Int
  orgaoSuperiorCodigo: String
  orgaoSolicitanteCodigo: String
  search: String
  situacao: String
  processoId: String
  pcdp: String
  cpfViajante: String
  nomeViajante: String
  cargo: String
  funcao: String
  destino: String
  motivo: String
  apenasParlamentares: Boolean = false
  cargoParlamentar: CargoParlamentarFiltro
}
```

Enum:

```graphql
enum CargoParlamentarFiltro {
  DEPUTADO
  SENADOR
}
```

## Mapeamento real do banco

Os filtros e relacionamentos de viagens seguem as colunas reais do PostgreSQL:

- `processoId` -> `viagens.processo_id`
- `pcdp` -> `viagens.pcdp`
- `cpfViajante` -> `viagens.cpf_viajante`
- `nomeViajante` -> `viagens.nome_viajante`
- `cargo` -> `viagens.cargo`
- `funcao` -> `viagens.funcao` e `viagens.descricao_funcao`
- `destino` -> `viagens.destinos`
- `motivo` -> `viagens.motivo`
- `situacao` -> `viagens.situacao`
- `orgaoSuperiorCodigo` -> `viagens.orgao_superior_codigo`
- `orgaoSolicitanteCodigo` -> `viagens.orgao_solicitante_codigo`

Os detalhes aninhados usam o relacionamento real por `processo_id`:

- `viagens` -> `passagens` por `processo_id`
- `viagens` -> `pagamentos` por `processo_id`
- `viagens` -> `trechos` por `processo_id`

O recorte de parlamentares usa a tabela `politicos` apenas para identificar nomes e cargos parlamentares, porque nao existe chave estrangeira direta entre `politicos` e `viagens`.

Comportamento importante:

- filtros de painel e ranking operam sobre a tabela `viagens`
- detalhes de `passagens`, `pagamentos` e `trechos` entram no drill-down por `processoId`
- `funcao` busca em `viagens.funcao` e `viagens.descricao_funcao`
- `destino` busca no campo-resumo `viagens.destinos`; os detalhes finos de cidade, UF e pais ficam nos campos aninhados de `passagens` e `trechos`

## Recortes prontos

Comportamento recomendado para o painel principal:

- usar `apenasParlamentares: false` como default
- tratar `DEPUTADO` e `SENADOR` como recortes especiais, nao como base do dashboard geral
- usar os endpoints anuais genericos (`topViajantesAno` e `topGastadoresViagensAno`) para ranking geral; os endpoints `topDeputados*` e `topSenadores*` sao os recortes parlamentares explicitos

### Geral

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "apenasParlamentares": false
  }
}
```

### Apenas deputados

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "apenasParlamentares": true,
    "cargoParlamentar": "DEPUTADO"
  }
}
```

### Apenas senadores

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "apenasParlamentares": true,
    "cargoParlamentar": "SENADOR"
  }
}
```

## Queries oficiais

### 1. KPIs globais da area

```graphql
query ResumoViagens($filtro: RankingViagemFiltroInput) {
  resumoViagens(filtro: $filtro) {
    totalViagens
    totalViajantes
    totalOrgaosSuperiores
    totalOrgaosSolicitantes
    totalTrechos
    totalDiariasCents
    totalPassagensCents
    totalPagamentosCents
    totalOutrosGastosCents
    totalDevolucaoCents
    totalGastoBrutoCents
    totalGastoLiquidoCents
    ticketMedioViagemCents
    gastoMedioViajanteCents
    periodo {
      anoInicio
      anoFim
    }
  }
}
```

Exemplo de variaveis:

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "apenasParlamentares": false
  }
}
```

### 2. Tabela global de viagens

```graphql
query ViagensPainel($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
  viagensPainel(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
    total
    limit
    offset
    nodes {
      processoId
      pcdp
      situacao
      viagemUrgente
      justificativaUrgencia
      orgaoSuperiorCodigo
      orgaoSuperiorNome
      orgaoSolicitanteCodigo
      orgaoSolicitanteNome
      cpfViajante
      nomeViajante
      cargo
      funcao
      descricaoFuncao
      dataInicio
      dataFim
      destinos
      motivo
      valorDiariasCents
      valorPassagensCents
      valorDevolucaoCents
      valorOutrosGastosCents
      ano
      importedAt
    }
  }
}
```

Exemplo de variaveis:

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "search": "kim",
    "destino": "brasilia",
    "apenasParlamentares": false
  },
  "limit": 20,
  "offset": 0
}
```

### 2.1. Tabela global com filtros exatos do banco

```json
{
  "filtro": {
    "anoInicio": 2024,
    "anoFim": 2024,
    "processoId": "0001234-25.2024.1.00.0000",
    "pcdp": "123456/24",
    "cpfViajante": "00000000000",
    "nomeViajante": "kim kataguiri",
    "cargo": "deputado",
    "funcao": "parlamentar",
    "destino": "brasilia",
    "motivo": "missao oficial",
    "situacao": "aprovada",
    "apenasParlamentares": false
  },
  "limit": 20,
  "offset": 0
}
```

### 2.2. Consulta direta por processo

Quando o front ja conhece o `processoId`, esse e o filtro mais confiavel para abrir um detalhe:

```json
{
  "filtro": {
    "processoId": "0001234-25.2024.1.00.0000"
  },
  "limit": 1,
  "offset": 0
}
```

### 3. Ranking de pessoas com mais viagens

```graphql
query TopViajantes($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
  topViajantes(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
    total
    nodes {
      cpfViajante
      nomeViajante
      cargo
      funcao
      descricaoFuncao
      totalViagens
      totalTrechos
      totalDiariasCents
      totalPassagensCents
      totalPagamentosCents
      totalOutrosGastosCents
      totalDevolucaoCents
      totalGastoBrutoCents
      totalGastoLiquidoCents
    }
  }
}
```

### 4. Ranking de pessoas que mais gastaram com viagens

```graphql
query TopGastadoresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
  topGastadoresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
    total
    nodes {
      cpfViajante
      nomeViajante
      cargo
      totalViagens
      totalPagamentosCents
      totalPassagensCents
      totalDiariasCents
      totalOutrosGastosCents
      totalDevolucaoCents
      totalGastoBrutoCents
      totalGastoLiquidoCents
    }
  }
}
```

### 5. Ranking de orgaos superiores

```graphql
query TopOrgaosSuperioresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
  topOrgaosSuperioresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
    total
    nodes {
      codigoOrgao
      nomeOrgao
      totalViagens
      totalViajantes
      totalTrechos
      totalDiariasCents
      totalPassagensCents
      totalPagamentosCents
      totalOutrosGastosCents
      totalDevolucaoCents
      totalGastoBrutoCents
      totalGastoLiquidoCents
    }
  }
}
```

### 6. Ranking de orgaos solicitantes

```graphql
query TopOrgaosSolicitantesViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
  topOrgaosSolicitantesViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
    total
    nodes {
      codigoOrgao
      nomeOrgao
      totalViagens
      totalViajantes
      totalTrechos
      totalDiariasCents
      totalPassagensCents
      totalPagamentosCents
      totalOutrosGastosCents
      totalDevolucaoCents
      totalGastoBrutoCents
      totalGastoLiquidoCents
    }
  }
}
```

### 7. Rankings anuais prontos

```graphql
query {
  topViajantesAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      cargo
      totalViagens
      totalGastoLiquidoCents
    }
  }
}
```

```graphql
query {
  topGastadoresViagensAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      cargo
      totalViagens
      totalPagamentosCents
      totalGastoLiquidoCents
    }
  }
}
```

```graphql
query {
  topDeputadosViajantesAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      totalViagens
      totalGastoLiquidoCents
    }
  }
}
```

```graphql
query {
  topSenadoresViajantesAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      totalViagens
      totalGastoLiquidoCents
    }
  }
}
```

```graphql
query {
  topDeputadosGastadoresViagensAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      totalPagamentosCents
      totalGastoLiquidoCents
    }
  }
}
```

```graphql
query {
  topSenadoresGastadoresViagensAno(ano: 2024, pagination: { limit: 30, offset: 0 }) {
    total
    nodes {
      nomeViajante
      totalPagamentosCents
      totalGastoLiquidoCents
    }
  }
}
```

### 8. Detalhe de um politico com viagens

```graphql
query DetalhePoliticoViagens($id: ID!, $anoInicio: Int, $anoFim: Int) {
  politico(id: $id) {
    id
    nomeCanonico
    nomeCompleto
    gastos(filtro: { anoInicio: $anoInicio, anoFim: $anoFim }) {
      totalViagens
      totalTrechos
      totalDiariasCents
      totalPassagensCents
      totalPagamentosCents
      totalOutrosGastosCents
      totalDevolucaoCents
    }
    viagens(anoInicio: $anoInicio, anoFim: $anoFim, pagination: { limit: 10, offset: 0 }) {
      total
      nodes {
        processoId
        dataInicio
        dataFim
        destinos
        motivo
        valorDiariasCents
        valorPassagensCents
        valorOutrosGastosCents
        valorDevolucaoCents
      }
    }
  }
}
```

### 9. Detalhe completo de uma viagem

A API usa `processoId` como chave da viagem. Os detalhes saem pelos campos aninhados de `Viagem`.

```graphql
query DetalheViagemExpandida($id: ID!, $anoInicio: Int, $anoFim: Int) {
  politico(id: $id) {
    viagens(anoInicio: $anoInicio, anoFim: $anoFim, pagination: { limit: 10, offset: 0 }) {
      nodes {
        processoId
        nomeViajante
        passagens(pagination: { limit: 10, offset: 0 }) {
          total
          nodes {
            id
            meioTransporte
            idaOrigemCidade
            idaDestinoCidade
            voltaOrigemCidade
            voltaDestinoCidade
            valorPassagemCents
            taxaServicoCents
            emissaoData
          }
        }
        pagamentos(pagination: { limit: 10, offset: 0 }) {
          total
          nodes {
            id
            tipoPagamento
            orgaoPagadorNome
            ugPagadoraNome
            valorCents
            ano
          }
        }
        trechos(pagination: { limit: 10, offset: 0 }) {
          total
          nodes {
            id
            sequencia
            origemData
            origemCidade
            destinoData
            destinoCidade
            meioTransporte
            numeroDiarias
            missao
          }
        }
      }
    }
  }
}
```

## Estrategia recomendada para o frontend

### Ordem de carregamento

1. `resumoViagens`
2. `topGastadoresViagens` e `topViajantes`
3. `topOrgaosSuperioresViagens` e `topOrgaosSolicitantesViagens`
4. `viagensPainel`
5. detalhe expandido sob demanda com `passagens`, `pagamentos` e `trechos`

### Limites recomendados

- tabela principal: `limit 20`
- rankings: `limit 10`, `20` ou `30`
- detalhes aninhados: `limit 5` ou `10`

### Regras

- nunca pedir tudo em uma query monolitica
- usar paginação em todas as listas
- usar filtros server-side, nao filtrar tudo no cliente
- converter todos os campos `*Cents` para BRL no front
- exibir `request_id` quando houver erro GraphQL

## Campos monetarios

Todos os campos em `*Cents` devem ser convertidos assim:

```ts
const valor = Number(cents) / 100;
```

Exemplo:

```ts
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(cents) / 100);
```

## Observacao importante

Na area de viagens faz sentido segmentar:

- geral de parlamentares
- deputados
- senadores

Nao faz sentido segmentar por bancada no dataset de viagens, porque a base e por pessoa (`nome_viajante` e `cpf_viajante`), nao por autoria coletiva.
