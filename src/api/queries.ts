// ─── Health ───
export const HEALTH_QUERY = `
  query { health { status db redis timestamp } }
`;

// ─── Listagem de políticos ───
export const POLITICOS_LIST_QUERY = `
  query Politicos($filter: PoliticoFilterInput, $pagination: PaginationInput) {
    politicos(filter: $filter, pagination: $pagination) {
      total limit offset
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl dataNascimento }
    }
  }
`;

// ─── Político por ID ───
export const POLITICO_DETALHE_QUERY = `
  query PoliticoDetalhe($id: ID, $nomeCanonico: String) {
    politico(id: $id, nomeCanonico: $nomeCanonico) {
      id nomeCanonico nomeCompleto partido cargoAtual uf dataNascimento fotoUrl
      perfilExterno {
        camara { id nome siglaPartido siglaUf urlFoto email uri fonte }
        senado { codigo nome nomeCompleto siglaPartido uf email urlFoto urlPagina afastadoAtual fonte }
        tse { termoBusca fonte }
        lexml { total documentos { titulo identificador tipo data url fonte } }
        brasilIo { total candidatos { anoEleicao siglaUf nomeUrna nomeCompleto numeroCandidato siglaPartido descricaoCargo situacaoCandidatura fonte } }
        wikipedia { titulo resumo url fonte }
      }
    }
  }
`;

// ─── Gastos agregados ───
export const GASTOS_POLITICO_QUERY = `
  query GastosPolitico($input: GastosPoliticoInput!) {
    gastosPolitico(input: $input) {
      totalViagens totalTrechos totalDiariasCents totalPassagensCents
      totalPagamentosCents totalOutrosGastosCents totalDevolucaoCents
      periodo { anoInicio anoFim }
    }
  }
`;

// ─── Viagens paginadas ───
export const VIAGENS_POLITICO_QUERY = `
  query ViagensPolitico($input: ViagensPoliticoInput!, $pagination: PaginationInput) {
    viagensPolitico(input: $input, pagination: $pagination) {
      total limit offset
      nodes {
        processoId dataInicio dataFim nomeViajante motivo valorDiariasCents valorPassagensCents
        trechos(pagination: { limit: 5, offset: 0 }) { total nodes { id origemCidade destinoCidade } }
      }
    }
  }
`;

// ─── Emendas resumo ───
export const EMENDAS_RESUMO_POLITICO_QUERY = `
  query EmendasResumoPolitico($input: EmendasPoliticoInput!) {
    emendasResumoPolitico(input: $input) {
      totalEmendas totalEmpenhadoCents totalLiquidadoCents totalPagoCents
      totalRecebidoFavorecidosCents totalFavorecidos
    }
  }
`;

// ─── Emendas paginadas ───
export const EMENDAS_POLITICO_QUERY = `
  query EmendasPolitico($input: EmendasPoliticoInput!, $pagination: PaginationInput) {
    emendasPolitico(input: $input, pagination: $pagination) {
      total limit offset
      nodes {
        id codigoEmenda anoEmenda tipoEmenda nomeAutorEmenda valorPagoCents
      }
    }
  }
`;

// ─── Top geral emendas por ano ───
export const TOP_GASTADORES_EMENDAS_ANO_QUERY = `
  query TopGastadoresEmendasAno($ano: Int!, $pagination: PaginationInput) {
    topGastadoresEmendasAno(ano: $ano, pagination: $pagination) {
      total limit offset
      nodes {
        codigoAutorEmenda nomeAutorEmenda totalEmendas totalPagoCents
        totalEmpenhadoCents totalLiquidadoCents
        totalRpInscritosCents totalRpCanceladosCents totalRpPagosCents
      }
    }
  }
`;

// ─── Top deputados emendas ───
export const TOP_DEPUTADOS_EMENDAS_QUERY = `
  query TopDeputadosEmendas($ano: Int!, $pagination: PaginationInput) {
    topDeputadosEmendasAno(ano: $ano, pagination: $pagination) {
      total
      nodes { nomeAutorEmenda totalEmendas totalPagoCents }
    }
  }
`;

// ─── Top senadores emendas ───
export const TOP_SENADORES_EMENDAS_QUERY = `
  query TopSenadoresEmendas($ano: Int!, $pagination: PaginationInput) {
    topSenadoresEmendasAno(ano: $ano, pagination: $pagination) {
      total
      nodes { nomeAutorEmenda totalEmendas totalPagoCents }
    }
  }
`;

// ─── Top emendas por país ───
export const TOP_EMENDAS_POR_PAIS_ANO_QUERY = `
  query TopEmendasPorPaisAno($ano: Int!, $pagination: PaginationInput) {
    topEmendasPorPaisAno(ano: $ano, pagination: $pagination) {
      total limit offset
      nodes { pais totalEmendas totalPagoCents totalEmpenhadoCents totalLiquidadoCents }
    }
  }
`;

// ─── Ranking custom (filtros avançados) ───
export const TOP_GASTADORES_EMENDAS_QUERY = `
  query TopGastadoresEmendas($filtro: RankingEmendaFiltroInput, $pagination: PaginationInput) {
    topGastadoresEmendas(filtro: $filtro, pagination: $pagination) {
      total
      nodes { nomeAutorEmenda totalPagoCents totalEmendas }
    }
  }
`;

export const FEATURED_POLITICOS_QUERY = `
  query FeaturedPoliticos {
    lula: politicos(filter: { search: "lula" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
    bolsonaro: politicos(filter: { search: "bolsonaro" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
    arthurLira: politicos(filter: { search: "arthur lira" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
    daviAlcolumbre: politicos(filter: { search: "davi alcolumbre" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
    flavioDino: politicos(filter: { search: "flavio dino" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
    simoneTebet: politicos(filter: { search: "simone tebet" }, pagination: { limit: 1, offset: 0 }) {
      nodes { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    }
  }
`;
