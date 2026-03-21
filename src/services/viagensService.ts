import { restRequest } from "@/api/restClient";
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

function filtroParams(filtro?: RankingViagemFiltroInput) {
  const normalized = normalizeViagensFilter(filtro);
  return normalized ?? {};
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
  return restRequest<ResumoViagens>("/api/viagens/resumo", {
    params: filtroParams(filtro),
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });
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
  const data = await restRequest<Connection<Viagem>>("/api/viagens", {
    params: {
      ...filtroParams(normalizedFilter),
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
    },
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });
  return toConnection(data, normalizedPagination);
}

export async function fetchTopViajantes(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await restRequest<Connection<ViagemPessoaRanking>>("/api/viagens/top-viajantes", {
    params: {
      ...filtroParams(normalizedFilter),
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
      includeTotal: false,
    },
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });

  return toConnection(data, normalizedPagination);
}

export async function fetchTopGastadoresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await restRequest<Connection<ViagemPessoaRanking>>("/api/viagens/top-gastadores", {
    params: {
      ...filtroParams(normalizedFilter),
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
      includeTotal: false,
    },
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });

  return toConnection(data, normalizedPagination);
}

export async function fetchTopOrgaosSuperioresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await restRequest<Connection<ViagemOrgaoRanking>>("/api/viagens/top-orgaos-superiores", {
    params: {
      ...filtroParams(normalizedFilter),
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
      includeTotal: false,
    },
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });

  return toConnection(data, normalizedPagination);
}

export async function fetchTopOrgaosSolicitantesViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination);
  const data = await restRequest<Connection<ViagemOrgaoRanking>>("/api/viagens/top-orgaos-solicitantes", {
    params: {
      ...filtroParams(normalizedFilter),
      limit: normalizedPagination.limit,
      offset: normalizedPagination.offset,
      includeTotal: false,
    },
    signal: options?.signal,
    timeoutMs: TRAVEL_DASHBOARD_TIMEOUT_MS,
    retries: 0,
  });

  return toConnection(data, normalizedPagination);
}

export async function fetchDetalheViagemPorProcesso(
  input: ViagemDetalheInput,
  options?: { signal?: AbortSignal }
) {
  if (!input.processoId) {
    throw new Error("Processo da viagem nao informado.");
  }
  const data = await restRequest<ViagemDetalheResult>(
    `/api/viagens/${encodeURIComponent(input.processoId)}`,
    {
      params: {
        passagensLimit: DEFAULT_VIAGENS_DETAIL_LIMIT,
        pagamentosLimit: DEFAULT_VIAGENS_DETAIL_LIMIT,
        trechosLimit: DEFAULT_VIAGENS_DETAIL_LIMIT,
      },
      signal: options?.signal,
      timeoutMs: TRAVEL_DETAIL_TIMEOUT_MS,
      retries: 0,
    }
  );

  const viagem = data.viagem;
  if (!viagem) {
    throw new Error("Nao foi possivel localizar o detalhe expandido desta viagem.");
  }

  return { viagem } satisfies ViagemDetalheResult;
}
