# Testes GraphQL rapidos

## Health pelo GraphQL

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health { status db redis timestamp } }"}'
```

## Buscar politico por ID

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: ID!){ politico(id:$id){ id nomeCanonico partido uf } }","variables":{"id":"SEU_ID"}}'
```

## Gastos agregados de um politico

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: ID!){ gastosPolitico(input:{politicoId:$id,filtro:{anoInicio:2023,anoFim:2025}}){ totalViagens totalPagamentosCents totalPassagensCents } }","variables":{"id":"SEU_ID"}}'
```

## Viagens paginadas por politico

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: ID!){ viagensPolitico(input:{politicoId:$id,anoInicio:2024,anoFim:2025},pagination:{limit:10,offset:0}){ total nodes { processoId dataInicio valorPassagensCents } } }","variables":{"id":"SEU_ID"}}'
```

## Perfil externo (Camara + Senado + TSE + LexML + Brasil.IO + Wikipedia)

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: ID!){ politico(id:$id){ id nomeCanonico perfilExterno{ camara{ id nome siglaPartido siglaUf } senado{ codigo nome siglaPartido uf afastadoAtual } tse{ termoBusca datasetCandidatosUrl datasetResultadosUrl divulgaCandContasUrl } lexml{ total documentos{ titulo tipo data url } } brasilIo{ total candidatos{ anoEleicao nomeUrna siglaPartido descricaoCargo situacaoCandidatura } } wikipedia{ titulo url } } } }","variables":{"id":"SEU_ID"}}'
```

## Perfil completo (recomendado para performance)

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: ID!){ politico(id:$id){ id nomeCanonico nomeCompleto gastos(filtro:{anoInicio:2019,anoFim:2026}){ totalViagens totalTrechos totalPagamentosCents } viagens(anoInicio:2019,anoFim:2026,pagination:{limit:20,offset:0}){ total nodes{ processoId dataInicio dataFim valorDiariasCents valorPassagensCents passagens(pagination:{limit:20,offset:0}){ total nodes{ id valorPassagemCents emissaoData } } pagamentos(pagination:{limit:20,offset:0}){ total nodes{ id tipoPagamento valorCents } } trechos(pagination:{limit:20,offset:0}){ total nodes{ id sequencia origemCidade destinoCidade } } } } emendas(filtro:{anoInicio:2019,anoFim:2026},pagination:{limit:20,offset:0}){ total nodes{ id codigoEmenda anoEmenda valorPagoCents convenios(pagination:{limit:20,offset:0}){ total nodes{ id valorConvenioCents dataPublicacaoConvenio } } favorecidos(pagination:{limit:20,offset:0}){ total nodes{ id favorecido valorRecebidoCents } } } } } }","variables":{"id":"SEU_ID"}}'
```

Para volume grande, nao use `limit:200` em todos os niveis ao mesmo tempo. Paginar com `offset` por camada reduz latencia e evita timeouts.

## Top 30 politicos que mais gastaram em emendas

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topGastadoresEmendas(filtro:{anoInicio:2019,anoFim:2026,apenasParlamentares:true},pagination:{limit:30,offset:0}){ total nodes{ codigoAutorEmenda nomeAutorEmenda totalEmendas totalEmpenhadoCents totalLiquidadoCents totalPagoCents totalRpInscritosCents totalRpCanceladosCents totalRpPagosCents } } }"}'
```

## Ranking de emendas por pais

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topEmendasPorPais(filtro:{anoInicio:2019,anoFim:2026},pagination:{limit:30,offset:0}){ total nodes{ pais totalEmendas totalEmpenhadoCents totalLiquidadoCents totalPagoCents totalRpInscritosCents totalRpCanceladosCents totalRpPagosCents } } }"}'
```

## Top 30 por ano (endpoint recomendado)

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topGastadoresEmendasAno(ano:2024,pagination:{limit:30,offset:0}){ total nodes{ codigoAutorEmenda nomeAutorEmenda totalEmendas totalPagoCents totalEmpenhadoCents totalLiquidadoCents } } }"}'
```

## Top 30 por ano separado por cargo

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topDeputadosEmendasAno(ano:2024,pagination:{limit:30,offset:0}){ total nodes{ nomeAutorEmenda totalPagoCents totalEmendas } } }"}'
```

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topSenadoresEmendasAno(ano:2024,pagination:{limit:30,offset:0}){ total nodes{ nomeAutorEmenda totalPagoCents totalEmendas } } }"}'
```

```bash
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ topEmendasPorPaisAno(ano:2024,pagination:{limit:30,offset:0}){ total nodes{ pais totalEmendas totalPagoCents totalEmpenhadoCents totalLiquidadoCents } } }"}'
```
