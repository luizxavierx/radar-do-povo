export const HEALTH_QUERY = `
  query Health {
    health {
      status
      db
      redis
      timestamp
    }
  }
`;

export const POLITICOS_LIST_QUERY = `
  query Politicos($filter: PoliticoFilterInput, $pagination: PaginationInput) {
    politicos(filter: $filter, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        id
        nomeCanonico
        nomeCompleto
        partido
        cargoAtual
        uf
        fotoUrl
        dataNascimento
      }
    }
  }
`;

// Block A: basic profile
export const POLITICO_BASICO_QUERY = `
  query PoliticoBasico($id: ID, $nomeCanonico: String) {
    politico(id: $id, nomeCanonico: $nomeCanonico) {
      id
      nomeCanonico
      nomeCompleto
      partido
      cargoAtual
      uf
      dataNascimento
      fotoUrl
    }
  }
`;

export const POLITICO_DOSSIE_COMPLETO_QUERY = `
  query DossieCompleto($nome: String!, $anoInicio: Int!, $anoFim: Int!) {
    politicos(filter: { search: $nome }, pagination: { limit: 1, offset: 0 }) {
      total
      limit
      offset
      nodes {
        id
        nomeCanonico
        nomeCompleto
        partido
        uf
        cargoAtual
        dataNascimento
        fotoUrl
        perfilExterno {
          camara { id nome siglaPartido siglaUf email uri urlFoto fonte }
          senado { codigo nome nomeCompleto siglaPartido uf email urlFoto urlPagina afastadoAtual fonte }
          tse { termoBusca datasetCandidatosUrl datasetResultadosUrl candidatosCdnBaseUrl divulgaCandContasUrl fonte }
          lexml { total documentos { titulo tipo data url } }
          brasilIo { total candidatos { anoEleicao nomeUrna siglaPartido descricaoCargo situacaoCandidatura } }
          wikipedia { titulo resumo url fonte }
        }
        gastos(filtro: { anoInicio: $anoInicio, anoFim: $anoFim }) {
          totalViagens
          totalTrechos
          totalDiariasCents
          totalPassagensCents
          totalPagamentosCents
          totalOutrosGastosCents
          totalDevolucaoCents
        }
        viagens(anoInicio: $anoInicio, anoFim: $anoFim, pagination: { limit: 50, offset: 0 }) {
          total
          limit
          offset
          nodes {
            processoId
            dataInicio
            dataFim
            nomeViajante
            motivo
            valorDiariasCents
            valorPassagensCents
            pagamentos(pagination: { limit: 30, offset: 0 }) { total limit offset nodes { id tipoPagamento valorCents ano } }
            passagens(pagination: { limit: 30, offset: 0 }) { total limit offset nodes { id meioTransporte valorPassagemCents taxaServicoCents } }
            trechos(pagination: { limit: 30, offset: 0 }) { total limit offset nodes { id sequencia origemCidade destinoCidade } }
          }
        }
        emendas(filtro: { anoInicio: $anoInicio, anoFim: $anoFim }, pagination: { limit: 50, offset: 0 }) {
          total
          limit
          offset
          nodes {
            id
            codigoEmenda
            anoEmenda
            tipoEmenda
            nomeAutorEmenda
            valorEmpenhadoCents
            valorLiquidadoCents
            valorPagoCents
            convenios(pagination: { limit: 30, offset: 0 }) { total limit offset nodes { id numeroConvenio valorConvenioCents } }
            favorecidos(pagination: { limit: 30, offset: 0 }) { total limit offset nodes { id favorecido valorRecebidoCents } }
          }
        }
      }
    }
  }
`;

// Block B: expenses + amendments summary
export const POLITICO_RESUMO_FINANCEIRO_QUERY = `
  query PoliticoResumoFinanceiro(
    $gastosInput: GastosPoliticoInput!
    $emendasInput: EmendasPoliticoInput!
  ) {
    gastosPolitico(input: $gastosInput) {
      totalViagens
      totalTrechos
      totalDiariasCents
      totalPassagensCents
      totalPagamentosCents
      totalOutrosGastosCents
      totalDevolucaoCents
      periodo {
        anoInicio
        anoFim
      }
    }
    emendasResumoPolitico(input: $emendasInput) {
      totalEmendas
      totalEmpenhadoCents
      totalLiquidadoCents
      totalPagoCents
      totalRecebidoFavorecidosCents
      totalFavorecidos
    }
  }
`;

// Block C: paginated trips
export const VIAGENS_POLITICO_QUERY = `
  query ViagensPolitico($input: ViagensPoliticoInput!, $pagination: PaginationInput) {
    viagensPolitico(input: $input, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        processoId
        dataInicio
        dataFim
        nomeViajante
        motivo
        valorDiariasCents
        valorPassagensCents
        trechos(pagination: { limit: 10, offset: 0 }) {
          total
          nodes {
            id
            sequencia
            origemCidade
            destinoCidade
          }
        }
      }
    }
  }
`;

// Block D: paginated amendments
export const EMENDAS_POLITICO_QUERY = `
  query EmendasPolitico($input: EmendasPoliticoInput!, $pagination: PaginationInput) {
    emendasPolitico(input: $input, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        id
        codigoEmenda
        anoEmenda
        tipoEmenda
        nomeAutorEmenda
        valorPagoCents
      }
    }
  }
`;

// Block E: external profile, request only fields needed by current screen
export const POLITICO_PERFIL_EXTERNO_QUERY = `
  query PoliticoPerfilExterno(
    $id: ID!
    $includeCamara: Boolean = true
    $includeSenado: Boolean = true
    $includeTse: Boolean = false
    $includeLexml: Boolean = true
    $includeBrasilIo: Boolean = true
    $includeWikipedia: Boolean = true
  ) {
    politico(id: $id) {
      id
      nomeCanonico
      perfilExterno {
        camara @include(if: $includeCamara) {
          nome
          siglaPartido
          siglaUf
          urlFoto
          email
          uri
          fonte
        }
        senado @include(if: $includeSenado) {
          codigo
          nome
          nomeCompleto
          siglaPartido
          uf
          email
          urlFoto
          urlPagina
          afastadoAtual
          fonte
        }
        tse @include(if: $includeTse) {
          termoBusca
          fonte
        }
        lexml @include(if: $includeLexml) {
          total
          documentos {
            titulo
            tipo
            data
            url
            fonte
          }
        }
        brasilIo @include(if: $includeBrasilIo) {
          total
          candidatos {
            anoEleicao
            descricaoCargo
            siglaPartido
            situacaoCandidatura
            fonte
          }
        }
        wikipedia @include(if: $includeWikipedia) {
          titulo
          resumo
          url
          fonte
        }
      }
    }
  }
`;

export const TOP_GASTADORES_EMENDAS_ANO_QUERY = `
  query TopGastadoresEmendasAno($ano: Int!, $pagination: PaginationInput) {
    topGastadoresEmendasAno(ano: $ano, pagination: $pagination) {
      total
      limit
      offset
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
`;

export const TOP_DEPUTADOS_EMENDAS_QUERY = `
  query TopDeputadosEmendas($ano: Int!, $pagination: PaginationInput) {
    topDeputadosEmendasAno(ano: $ano, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        codigoAutorEmenda
        nomeAutorEmenda
        totalEmendas
        totalPagoCents
      }
    }
  }
`;

export const TOP_SENADORES_EMENDAS_QUERY = `
  query TopSenadoresEmendas($ano: Int!, $pagination: PaginationInput) {
    topSenadoresEmendasAno(ano: $ano, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        codigoAutorEmenda
        nomeAutorEmenda
        totalEmendas
        totalPagoCents
      }
    }
  }
`;

export const TOP_GERAL_ANO_QUERY = `
  query TopGeralAno($ano: Int!, $pagination: PaginationInput) {
    topGastadoresEmendas(
      filtro: { anoInicio: $ano, anoFim: $ano, apenasParlamentares: false }
      pagination: $pagination
    ) {
      total
      limit
      offset
      nodes {
        codigoAutorEmenda
        nomeAutorEmenda
        totalEmendas
        totalPagoCents
      }
    }
  }
`;

export const TOP_EMENDAS_POR_PAIS_ANO_QUERY = `
  query TopEmendasPorPaisAno($ano: Int!, $pagination: PaginationInput) {
    topEmendasPorPaisAno(ano: $ano, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        pais
        totalEmendas
        totalPagoCents
        totalEmpenhadoCents
        totalLiquidadoCents
      }
    }
  }
`;

export const TOP_GASTADORES_EMENDAS_QUERY = `
  query TopGastadoresEmendas($filtro: RankingEmendaFiltroInput, $pagination: PaginationInput) {
    topGastadoresEmendas(filtro: $filtro, pagination: $pagination) {
      total
      limit
      offset
      nodes {
        codigoAutorEmenda
        nomeAutorEmenda
        totalPagoCents
        totalEmendas
      }
    }
  }
`;

export const FEATURED_POLITICOS_QUERY = `
  query FeaturedPoliticos {
    lula: politico(nomeCanonico: "lula") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    bolsonaro: politico(nomeCanonico: "bolsonaro") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    arthurLira: politico(nomeCanonico: "arthur-lira") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    daviAlcolumbre: politico(nomeCanonico: "davi-alcolumbre") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    flavioDino: politico(nomeCanonico: "flavio-dino") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
    simoneTebet: politico(nomeCanonico: "simone-tebet") { id nomeCanonico nomeCompleto partido cargoAtual uf fotoUrl }
  }
`;
