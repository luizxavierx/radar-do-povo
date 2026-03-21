import { graphqlRequest } from "@/services/graphqlClient";
import type {
  Connection,
  PaginationInput,
  RankingViagemFiltroInput,
  ResumoViagens,
  Viagem,
  ViagemOrgaoRanking,
  ViagemPessoaRanking,
} from "@/api/types";

export type ViagensRecorte = "geral" | "deputados" | "senadores";

export interface ViagemDetalheInput {
  processoId: string;
  pcdp?: string;
  cpfViajante?: string;
  nomeViajante?: string;
  anoInicio?: number;
  anoFim?: number;
}

export interface ViagemDetalheResult {
  viagem?: Viagem;
}

export const DEFAULT_VIAGENS_TABLE_LIMIT = 20;
export const DEFAULT_VIAGENS_RANKING_LIMIT = 5;
export const DEFAULT_VIAGENS_DETAIL_LIMIT = 10;
const TRAVEL_DASHBOARD_TIMEOUT_MS = 45_000;
const TRAVEL_DETAIL_TIMEOUT_MS = 30_000;

const RESUMO_VIAGENS_QUERY = `
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
`;

const VIAGENS_PAINEL_QUERY = `
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
`;

const TOP_VIAJANTES_QUERY = `
  query TopViajantes($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topViajantes(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      nodes {
        cpfViajante
        nomeViajante
        cargo
        funcao
        descricaoFuncao
        totalViagens
        totalTrechos
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_GASTADORES_VIAGENS_QUERY = `
  query TopGastadoresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topGastadoresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      nodes {
        cpfViajante
        nomeViajante
        cargo
        funcao
        totalViagens
        totalTrechos
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_ORGAOS_SUPERIORES_QUERY = `
  query TopOrgaosSuperioresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topOrgaosSuperioresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      nodes {
        codigoOrgao
        nomeOrgao
        totalViagens
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_ORGAOS_SOLICITANTES_QUERY = `
  query TopOrgaosSolicitantesViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topOrgaosSolicitantesViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      nodes {
        codigoOrgao
        nomeOrgao
        totalViagens
        totalGastoLiquidoCents
      }
    }
  }
`;

const DETALHE_VIAGEM_QUERY = `
  query ViagemDetalhe($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
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
        passagens(pagination: { limit: 10, offset: 0 }) {
          total
          limit
          offset
          nodes {
            id
            processoId
            pcdp
            meioTransporte
            idaOrigemPais
            idaOrigemUf
            idaOrigemCidade
            idaDestinoPais
            idaDestinoUf
            idaDestinoCidade
            voltaOrigemPais
            voltaOrigemUf
            voltaOrigemCidade
            voltaDestinoPais
            voltaDestinoUf
            voltaDestinoCidade
            valorPassagemCents
            taxaServicoCents
            emissaoData
            emissaoHora
            ano
            importedAt
          }
        }
        pagamentos(pagination: { limit: 10, offset: 0 }) {
          total
          limit
          offset
          nodes {
            id
            processoId
            pcdp
            orgaoSuperiorCodigo
            orgaoSuperiorNome
            orgaoPagadorCodigo
            orgaoPagadorNome
            ugPagadoraCodigo
            ugPagadoraNome
            tipoPagamento
            valorCents
            ano
            importedAt
          }
        }
        trechos(pagination: { limit: 10, offset: 0 }) {
          total
          limit
          offset
          nodes {
            id
            processoId
            pcdp
            sequencia
            origemData
            origemPais
            origemUf
            origemCidade
            destinoData
            destinoPais
            destinoUf
            destinoCidade
            meioTransporte
            numeroDiarias
            missao
            ano
            importedAt
          }
        }
      }
    }
  }
`;

function trimOrUndefined(value?: string): string | undefined {
  const normalized = (value || "").trim();
  return normalized || undefined;
}

function toConnection<T>(
  payload: { total?: number; limit?: number; offset?: number; nodes?: T[] } | null | undefined,
  pagination: Required<PaginationInput>
): Connection<T> {
  return {
    total: payload?.total ?? 0,
    limit: payload?.limit ?? pagination.limit,
    offset: payload?.offset ?? pagination.offset,
    nodes: payload?.nodes ?? [],
  };
}

function normalizePagination(
  pagination?: PaginationInput,
  fallbackLimit = DEFAULT_VIAGENS_RANKING_LIMIT
): Required<PaginationInput> {
  const rawLimit = pagination?.limit ?? fallbackLimit;
  const rawOffset = pagination?.offset ?? 0;
  const limit = Math.min(30, Math.max(5, rawLimit));
  const offset = Math.max(0, rawOffset);
  return { limit, offset };
}

export function normalizeViagensFilter(
  filtro?: RankingViagemFiltroInput
): RankingViagemFiltroInput | undefined {
  if (!filtro) {
    return { apenasParlamentares: false };
  }

  const apenasParlamentares = filtro.apenasParlamentares === true;
  const cargoParlamentar = apenasParlamentares ? filtro.cargoParlamentar : undefined;

  const normalized: RankingViagemFiltroInput = {
    anoInicio: filtro.anoInicio,
    anoFim: filtro.anoFim,
    orgaoSuperiorCodigo: trimOrUndefined(filtro.orgaoSuperiorCodigo),
    orgaoSolicitanteCodigo: trimOrUndefined(filtro.orgaoSolicitanteCodigo),
    search: trimOrUndefined(filtro.search),
    situacao: trimOrUndefined(filtro.situacao),
    processoId: trimOrUndefined(filtro.processoId),
    pcdp: trimOrUndefined(filtro.pcdp),
    cpfViajante: trimOrUndefined(filtro.cpfViajante),
    nomeViajante: trimOrUndefined(filtro.nomeViajante),
    cargo: trimOrUndefined(filtro.cargo),
    funcao: trimOrUndefined(filtro.funcao),
    destino: trimOrUndefined(filtro.destino),
    motivo: trimOrUndefined(filtro.motivo),
    apenasParlamentares,
    cargoParlamentar,
  };

  const hasValue = Object.values(normalized).some((value) => value !== undefined);
  return hasValue ? normalized : undefined;
}

export function applyRecorteToViagensFilter(
  recorte: ViagensRecorte,
  filtro: RankingViagemFiltroInput
): RankingViagemFiltroInput {
  const base: RankingViagemFiltroInput = {
    ...filtro,
    apenasParlamentares: false,
    cargoParlamentar: undefined,
  };

  if (recorte === "deputados") {
    return {
      ...base,
      apenasParlamentares: true,
      cargoParlamentar: "DEPUTADO",
    };
  }

  if (recorte === "senadores") {
    return {
      ...base,
      apenasParlamentares: true,
      cargoParlamentar: "SENADOR",
    };
  }

  return base;
}

export async function fetchResumoViagens(
  filtro?: RankingViagemFiltroInput,
  options?: { signal?: AbortSignal }
) {
  const normalized = normalizeViagensFilter(filtro);
  const data = await graphqlRequest<{ resumoViagens: ResumoViagens }>(
    RESUMO_VIAGENS_QUERY,
    { filtro: normalized },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );
  return data.resumoViagens;
}

export async function fetchViagensPainel(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(
    pagination,
    DEFAULT_VIAGENS_TABLE_LIMIT
  );
  const data = await graphqlRequest<{ viagensPainel: Connection<Viagem> }>(
    VIAGENS_PAINEL_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );
  return toConnection(data.viagensPainel, normalizedPagination);
}

export async function fetchTopViajantes(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);

  const data = await graphqlRequest<{ topViajantes: Connection<ViagemPessoaRanking> }>(
    TOP_VIAJANTES_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );

  return toConnection(data.topViajantes, normalizedPagination);
}

export async function fetchTopGastadoresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);

  const data = await graphqlRequest<{ topGastadoresViagens: Connection<ViagemPessoaRanking> }>(
    TOP_GASTADORES_VIAGENS_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );

  return toConnection(data.topGastadoresViagens, normalizedPagination);
}

export async function fetchTopOrgaosSuperioresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await graphqlRequest<{
    topOrgaosSuperioresViagens: Connection<ViagemOrgaoRanking>;
  }>(
    TOP_ORGAOS_SUPERIORES_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );

  return toConnection(data.topOrgaosSuperioresViagens, normalizedPagination);
}

export async function fetchTopOrgaosSolicitantesViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await graphqlRequest<{
    topOrgaosSolicitantesViagens: Connection<ViagemOrgaoRanking>;
  }>(
    TOP_ORGAOS_SOLICITANTES_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS, retries: 0 }
  );

  return toConnection(data.topOrgaosSolicitantesViagens, normalizedPagination);
}

export async function fetchDetalheViagemPorProcesso(
  input: ViagemDetalheInput,
  options?: { signal?: AbortSignal }
) {
  if (!input.processoId) {
    throw new Error("Processo da viagem nao informado.");
  }
  const normalizedFilter = normalizeViagensFilter({
    anoInicio: input.anoInicio,
    anoFim: input.anoFim,
    processoId: input.processoId,
    pcdp: input.pcdp,
  });

  const data = await graphqlRequest<{ viagensPainel: Connection<Viagem> }>(
    DETALHE_VIAGEM_QUERY,
    {
      filtro: normalizedFilter,
      limit: 1,
      offset: 0,
    },
    { signal: options?.signal, timeoutMs: TRAVEL_DETAIL_TIMEOUT_MS, retries: 0 }
  );

  const viagem = data.viagensPainel?.nodes?.[0];
  if (!viagem) {
    throw new Error("Nao foi possivel localizar o detalhe expandido desta viagem.");
  }

  return { viagem } satisfies ViagemDetalheResult;
}
