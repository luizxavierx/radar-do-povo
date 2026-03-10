import { graphqlRequest } from "@/services/graphqlClient";
import type {
  CargoParlamentar,
  Connection,
  PaginationInput,
  PoliticoResumo,
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
  politico?: PoliticoResumo;
  viagem?: Viagem;
}

export const DEFAULT_VIAGENS_TABLE_LIMIT = 20;
export const DEFAULT_VIAGENS_RANKING_LIMIT = 10;
export const DEFAULT_VIAGENS_DETAIL_LIMIT = 10;

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
      total
      limit
      offset
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
`;

const TOP_GASTADORES_VIAGENS_QUERY = `
  query TopGastadoresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topGastadoresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      total
      limit
      offset
      nodes {
        cpfViajante
        nomeViajante
        cargo
        funcao
        totalViagens
        totalTrechos
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
`;

const TOP_ORGAOS_SUPERIORES_QUERY = `
  query TopOrgaosSuperioresViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topOrgaosSuperioresViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      total
      limit
      offset
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
`;

const TOP_ORGAOS_SOLICITANTES_QUERY = `
  query TopOrgaosSolicitantesViagens($filtro: RankingViagemFiltroInput, $limit: Int!, $offset: Int!) {
    topOrgaosSolicitantesViagens(filtro: $filtro, pagination: { limit: $limit, offset: $offset }) {
      total
      limit
      offset
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
`;

const TOP_VIAJANTES_ANO_QUERY = `
  query TopViajantesAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topViajantesAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
      total
      nodes {
        nomeViajante
        cargo
        totalViagens
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_GASTADORES_VIAGENS_ANO_QUERY = `
  query TopGastadoresViagensAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topGastadoresViagensAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
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
`;

const TOP_DEPUTADOS_VIAJANTES_ANO_QUERY = `
  query TopDeputadosViajantesAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topDeputadosViajantesAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
      total
      nodes {
        nomeViajante
        totalViagens
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_SENADORES_VIAJANTES_ANO_QUERY = `
  query TopSenadoresViajantesAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topSenadoresViajantesAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
      total
      nodes {
        nomeViajante
        totalViagens
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_DEPUTADOS_GASTADORES_ANO_QUERY = `
  query TopDeputadosGastadoresViagensAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topDeputadosGastadoresViagensAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
      total
      nodes {
        nomeViajante
        totalPagamentosCents
        totalGastoLiquidoCents
      }
    }
  }
`;

const TOP_SENADORES_GASTADORES_ANO_QUERY = `
  query TopSenadoresGastadoresViagensAno($ano: Int!, $limit: Int!, $offset: Int!) {
    topSenadoresGastadoresViagensAno(ano: $ano, pagination: { limit: $limit, offset: $offset }) {
      total
      nodes {
        nomeViajante
        totalPagamentosCents
        totalGastoLiquidoCents
      }
    }
  }
`;

const BUSCAR_POLITICO_POR_NOME_QUERY = `
  query BuscarPolitico($search: String!) {
    politicos(filter: { search: $search }, pagination: { limit: 5, offset: 0 }) {
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
      }
    }
  }
`;

const DETALHE_VIAGEM_EXPANDIDA_QUERY = `
  query DetalheViagemExpandida($id: ID!, $anoInicio: Int, $anoFim: Int, $limit: Int!, $offset: Int!) {
    politico(id: $id) {
      id
      nomeCanonico
      nomeCompleto
      partido
      cargoAtual
      uf
      fotoUrl
      viagens(anoInicio: $anoInicio, anoFim: $anoFim, pagination: { limit: $limit, offset: $offset }) {
        total
        limit
        offset
        nodes {
          processoId
          pcdp
          nomeViajante
          cargo
          funcao
          destinos
          motivo
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
              tipoPagamento
              orgaoPagadorNome
              ugPagadoraCodigo
              ugPagadoraNome
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

function normalizeText(value?: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function choosePoliticoCandidate(
  nodes: PoliticoResumo[],
  nomeViajante?: string
): PoliticoResumo | undefined {
  if (!nodes.length) return undefined;
  const target = normalizeText(nomeViajante);
  if (!target) return nodes[0];

  return (
    nodes.find((item) => normalizeText(item.nomeCompleto) === target) ||
    nodes.find((item) => normalizeText(item.nomeCanonico) === target) ||
    nodes.find((item) => normalizeText(item.nomeCompleto).includes(target)) ||
    nodes.find((item) => target.includes(normalizeText(item.nomeCanonico))) ||
    nodes[0]
  );
}

function shouldUseAnnualRanking(filtro?: RankingViagemFiltroInput): filtro is RankingViagemFiltroInput {
  if (!filtro?.anoInicio || !filtro?.anoFim) return false;
  if (filtro.anoInicio !== filtro.anoFim) return false;
  return !(
    trimOrUndefined(filtro.search) ||
    trimOrUndefined(filtro.situacao) ||
    trimOrUndefined(filtro.orgaoSuperiorCodigo) ||
    trimOrUndefined(filtro.orgaoSolicitanteCodigo) ||
    trimOrUndefined(filtro.processoId) ||
    trimOrUndefined(filtro.pcdp) ||
    trimOrUndefined(filtro.cpfViajante) ||
    trimOrUndefined(filtro.nomeViajante) ||
    trimOrUndefined(filtro.cargo) ||
    trimOrUndefined(filtro.funcao) ||
    trimOrUndefined(filtro.destino) ||
    trimOrUndefined(filtro.motivo)
  );
}

export function normalizeViagensFilter(
  filtro?: RankingViagemFiltroInput
): RankingViagemFiltroInput | undefined {
  if (!filtro) return undefined;

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
    apenasParlamentares: filtro.apenasParlamentares,
    cargoParlamentar: filtro.cargoParlamentar,
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
    apenasParlamentares: true,
  };

  if (recorte === "deputados") {
    return { ...base, cargoParlamentar: "DEPUTADO" };
  }

  if (recorte === "senadores") {
    return { ...base, cargoParlamentar: "SENADOR" };
  }

  return { ...base, cargoParlamentar: undefined };
}

export async function fetchResumoViagens(
  filtro?: RankingViagemFiltroInput,
  options?: { signal?: AbortSignal }
) {
  const normalized = normalizeViagensFilter(filtro);
  const data = await graphqlRequest<{ resumoViagens: ResumoViagens }>(
    RESUMO_VIAGENS_QUERY,
    { filtro: normalized },
    { signal: options?.signal, timeoutMs: 12_000 }
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
    { signal: options?.signal, timeoutMs: 15_000 }
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

  if (shouldUseAnnualRanking(normalizedFilter)) {
    const ano = normalizedFilter.anoInicio as number;
    let query = TOP_VIAJANTES_ANO_QUERY;
    if (normalizedFilter.cargoParlamentar === "DEPUTADO") {
      query = TOP_DEPUTADOS_VIAJANTES_ANO_QUERY;
    }
    if (normalizedFilter.cargoParlamentar === "SENADOR") {
      query = TOP_SENADORES_VIAJANTES_ANO_QUERY;
    }

    const key =
      normalizedFilter.cargoParlamentar === "DEPUTADO"
        ? "topDeputadosViajantesAno"
        : normalizedFilter.cargoParlamentar === "SENADOR"
        ? "topSenadoresViajantesAno"
        : "topViajantesAno";

    const data = await graphqlRequest<
      Record<string, { total?: number; nodes?: ViagemPessoaRanking[] }>
    >(
      query,
      { ano, limit: normalizedPagination.limit, offset: normalizedPagination.offset },
      { signal: options?.signal, timeoutMs: 12_000 }
    );

    return toConnection(data[key], normalizedPagination);
  }

  const data = await graphqlRequest<{ topViajantes: Connection<ViagemPessoaRanking> }>(
    TOP_VIAJANTES_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: 12_000 }
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

  if (shouldUseAnnualRanking(normalizedFilter)) {
    const ano = normalizedFilter.anoInicio as number;
    let query = TOP_GASTADORES_VIAGENS_ANO_QUERY;
    if (normalizedFilter.cargoParlamentar === "DEPUTADO") {
      query = TOP_DEPUTADOS_GASTADORES_ANO_QUERY;
    }
    if (normalizedFilter.cargoParlamentar === "SENADOR") {
      query = TOP_SENADORES_GASTADORES_ANO_QUERY;
    }

    const key =
      normalizedFilter.cargoParlamentar === "DEPUTADO"
        ? "topDeputadosGastadoresViagensAno"
        : normalizedFilter.cargoParlamentar === "SENADOR"
        ? "topSenadoresGastadoresViagensAno"
        : "topGastadoresViagensAno";

    const data = await graphqlRequest<
      Record<string, { total?: number; nodes?: ViagemPessoaRanking[] }>
    >(
      query,
      { ano, limit: normalizedPagination.limit, offset: normalizedPagination.offset },
      { signal: options?.signal, timeoutMs: 12_000 }
    );

    return toConnection(data[key], normalizedPagination);
  }

  const data = await graphqlRequest<{ topGastadoresViagens: Connection<ViagemPessoaRanking> }>(
    TOP_GASTADORES_VIAGENS_QUERY,
    {
      filtro: normalizedFilter,
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    { signal: options?.signal, timeoutMs: 12_000 }
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
    { signal: options?.signal, timeoutMs: 12_000 }
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
    { signal: options?.signal, timeoutMs: 12_000 }
  );

  return toConnection(data.topOrgaosSolicitantesViagens, normalizedPagination);
}

export async function fetchDetalheViagemPorProcesso(
  input: ViagemDetalheInput,
  options?: { signal?: AbortSignal }
) {
  const nomeViajante = trimOrUndefined(input.nomeViajante);
  const pcdp = trimOrUndefined(input.pcdp);
  if (!input.processoId) {
    throw new Error("Processo da viagem nao informado.");
  }
  if (!nomeViajante) {
    throw new Error("Nao foi possivel identificar o viajante desta linha.");
  }

  const searchResult = await graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
    BUSCAR_POLITICO_POR_NOME_QUERY,
    { search: nomeViajante },
    { signal: options?.signal, timeoutMs: 10_000 }
  );
  const politico = choosePoliticoCandidate(searchResult.politicos.nodes, nomeViajante);

  if (!politico?.id) {
    throw new Error(`Nao foi possivel localizar o politico de "${nomeViajante}".`);
  }

  const detailPagination = {
    limit: DEFAULT_VIAGENS_DETAIL_LIMIT,
    offset: 0,
  };

  let scannedPages = 0;
  let total = Number.MAX_SAFE_INTEGER;
  while (detailPagination.offset < total && scannedPages < 25) {
    const detailData = await graphqlRequest<{
      politico: (PoliticoResumo & { viagens?: Connection<Viagem> }) | null;
    }>(
      DETALHE_VIAGEM_EXPANDIDA_QUERY,
      {
        id: politico.id,
        anoInicio: input.anoInicio,
        anoFim: input.anoFim,
        limit: detailPagination.limit,
        offset: detailPagination.offset,
      },
      { signal: options?.signal, timeoutMs: 15_000 }
    );

    total = detailData.politico?.viagens?.total ?? 0;
    const match = detailData.politico?.viagens?.nodes?.find(
      (viagem) =>
        viagem.processoId === input.processoId ||
        (pcdp ? trimOrUndefined(viagem.pcdp) === pcdp : false)
    );

    if (match) {
      return {
        politico,
        viagem: match,
      } as ViagemDetalheResult;
    }

    detailPagination.offset += detailPagination.limit;
    scannedPages += 1;
  }

  throw new Error("Nao foi possivel localizar o detalhe expandido desta viagem.");
}
