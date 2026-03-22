import { restRequest } from "@/api/restClient";
import type {
  Connection,
  EmendaRankingResumo,
  EmendaSerieAnualNode,
  EmendaTipoRanking,
  PaginationInput,
  RankingEmendaFiltroInput,
  TopEmendaPais,
  TopGastadorEmenda,
} from "@/api/types";

const RANKINGS_TIMEOUT_MS = 30_000;

function trimOrUndefined(value?: string): string | undefined {
  const normalized = (value || "").trim();
  return normalized || undefined;
}

function normalizePagination(
  pagination?: PaginationInput,
  fallbackLimit = 30
): Required<PaginationInput> {
  const rawLimit = pagination?.limit ?? fallbackLimit;
  const rawOffset = pagination?.offset ?? 0;
  const limit = Math.min(30, Math.max(1, rawLimit));
  const offset = Math.max(0, rawOffset);
  return { limit, offset };
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

export function normalizeRankingEmendaFilter(
  filtro?: RankingEmendaFiltroInput
): RankingEmendaFiltroInput | undefined {
  if (!filtro) {
    return undefined;
  }

  const apenasParlamentares =
    typeof filtro.apenasParlamentares === "boolean" ? filtro.apenasParlamentares : undefined;
  const apenasBancadas =
    typeof filtro.apenasBancadas === "boolean" ? filtro.apenasBancadas : undefined;
  const cargoParlamentar =
    apenasParlamentares && !apenasBancadas ? filtro.cargoParlamentar : undefined;

  const normalized: RankingEmendaFiltroInput = {
    anoInicio: filtro.anoInicio,
    anoFim: filtro.anoFim,
    uf: trimOrUndefined(filtro.uf),
    tipoEmenda: trimOrUndefined(filtro.tipoEmenda),
    pais: trimOrUndefined(filtro.pais),
    apenasParlamentares: apenasBancadas ? false : apenasParlamentares,
    cargoParlamentar,
    apenasBancadas,
  };

  const hasValue = Object.values(normalized).some((value) => value !== undefined);
  return hasValue ? normalized : undefined;
}

function rankingParams(
  filtro: RankingEmendaFiltroInput | undefined,
  pagination: Required<PaginationInput>
) {
  const normalized = normalizeRankingEmendaFilter(filtro);
  return {
    ...normalized,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

export async function fetchTopGastadoresEmendas(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedPagination = normalizePagination(pagination, 30);
  const data = await restRequest<Connection<TopGastadorEmenda>>(
    "/api/emendas/rankings/top-gastadores",
    {
      params: rankingParams(filtro, normalizedPagination),
      signal: options?.signal,
      timeoutMs: RANKINGS_TIMEOUT_MS,
      retries: 0,
    }
  );

  return toConnection(data, normalizedPagination);
}

export async function fetchEmendasResumo(
  filtro?: RankingEmendaFiltroInput,
  options?: { signal?: AbortSignal }
) {
  return restRequest<EmendaRankingResumo>("/api/emendas/rankings/resumo", {
    params: normalizeRankingEmendaFilter(filtro),
    signal: options?.signal,
    timeoutMs: RANKINGS_TIMEOUT_MS,
    retries: 0,
  });
}

export async function fetchEmendasSerieAnual(
  filtro?: RankingEmendaFiltroInput,
  options?: { signal?: AbortSignal }
) {
  const data = await restRequest<Connection<EmendaSerieAnualNode>>(
    "/api/emendas/rankings/serie-anual",
    {
      params: normalizeRankingEmendaFilter(filtro),
      signal: options?.signal,
      timeoutMs: RANKINGS_TIMEOUT_MS,
      retries: 0,
    }
  );

  return {
    total: data?.total ?? data?.nodes?.length ?? 0,
    limit: data?.limit,
    offset: data?.offset,
    nodes: data?.nodes ?? [],
  };
}

export async function fetchTopEmendasPorPais(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedPagination = normalizePagination(pagination, 20);
  const data = await restRequest<Connection<TopEmendaPais>>(
    "/api/emendas/rankings/top-paises",
    {
      params: rankingParams(filtro, normalizedPagination),
      signal: options?.signal,
      timeoutMs: RANKINGS_TIMEOUT_MS,
      retries: 0,
    }
  );

  return toConnection(data, normalizedPagination);
}

export async function fetchTopTiposEmendas(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput,
  options?: { signal?: AbortSignal }
) {
  const normalizedPagination = normalizePagination(pagination, 8);
  const data = await restRequest<Connection<EmendaTipoRanking>>(
    "/api/emendas/rankings/top-tipos",
    {
      params: rankingParams(filtro, normalizedPagination),
      signal: options?.signal,
      timeoutMs: RANKINGS_TIMEOUT_MS,
      retries: 0,
    }
  );

  return toConnection(data, normalizedPagination);
}
