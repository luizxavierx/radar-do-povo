import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  VIAGENS_BUSCAR_POLITICO_QUERY,
  VIAGENS_DETALHE_QUERY,
  VIAGENS_LISTA_QUERY,
  VIAGENS_RESUMO_QUERY,
} from "@/api/queries";
import type {
  Connection,
  GastosAgregados,
  PaginationInput,
  PoliticoResumo,
  Viagem,
} from "@/api/types";
import {
  paginatedQueryDefaults,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "./queryShared";

const DEFAULT_ANO_INICIO = 2019;
const DEFAULT_ANO_FIM = 2026;
const DEFAULT_VIAGENS_LIMIT = 10;
const MIN_VIAGENS_LIMIT = 10;
const MAX_VIAGENS_LIMIT = 20;

function normalizeViagensPagination(
  pagination?: PaginationInput
): Required<PaginationInput> {
  const rawLimit = pagination?.limit ?? DEFAULT_VIAGENS_LIMIT;
  const rawOffset = pagination?.offset ?? 0;
  const limit = Math.min(MAX_VIAGENS_LIMIT, Math.max(MIN_VIAGENS_LIMIT, rawLimit));
  const offset = Math.max(0, rawOffset);
  return { limit, offset };
}

function emptyViagensConnection(pagination?: PaginationInput): Connection<Viagem> {
  const normalized = normalizeViagensPagination(pagination);
  return {
    total: 0,
    limit: normalized.limit,
    offset: normalized.offset,
    nodes: [],
  };
}

export function usePoliticoBusca(search?: string) {
  const normalizedSearch = (search || "").trim();

  return useQuery({
    queryKey: ["viagens-politico-busca", normalizedSearch],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
        VIAGENS_BUSCAR_POLITICO_QUERY,
        { search: normalizedSearch },
        { signal, timeoutMs: 10_000 }
      ).then((d) => d.politicos),
    enabled: normalizedSearch.length >= 2,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useResumoViagens(
  politicoId?: string,
  anoInicio = DEFAULT_ANO_INICIO,
  anoFim = DEFAULT_ANO_FIM
) {
  return useQuery({
    queryKey: ["resumo-viagens", politicoId, anoInicio, anoFim],
    queryFn: ({ signal }) =>
      graphqlRequest<{
        politico: (PoliticoResumo & { gastos?: GastosAgregados }) | null;
      }>(
        VIAGENS_RESUMO_QUERY,
        { id: politicoId, anoInicio, anoFim },
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.politico),
    enabled: Boolean(politicoId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useListaViagens(
  politicoId?: string,
  params?: {
    anoInicio?: number;
    anoFim?: number;
    pagination?: PaginationInput;
  }
) {
  const anoInicio = params?.anoInicio ?? DEFAULT_ANO_INICIO;
  const anoFim = params?.anoFim ?? DEFAULT_ANO_FIM;
  const pagination = normalizeViagensPagination(params?.pagination);

  return useQuery({
    queryKey: ["lista-viagens", politicoId, anoInicio, anoFim, pagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politico: { viagens?: Connection<Viagem> } | null }>(
        VIAGENS_LISTA_QUERY,
        {
          id: politicoId,
          anoInicio,
          anoFim,
          limit: pagination.limit,
          offset: pagination.offset,
        },
        { signal, timeoutMs: 15_000 }
      ).then((d) => d.politico?.viagens || emptyViagensConnection(pagination)),
    enabled: Boolean(politicoId),
    ...paginatedQueryDefaults,
  });
}

export function useDetalheViagem(
  politicoId?: string,
  params?: {
    anoInicio?: number;
    anoFim?: number;
    offsetViagens?: number;
    enabled?: boolean;
  }
) {
  const anoInicio = params?.anoInicio ?? DEFAULT_ANO_INICIO;
  const anoFim = params?.anoFim ?? DEFAULT_ANO_FIM;
  const offsetViagens = Math.max(0, params?.offsetViagens ?? 0);
  const enabled = Boolean(politicoId) && (params?.enabled ?? true);

  return useQuery({
    queryKey: ["detalhe-viagem", politicoId, anoInicio, anoFim, offsetViagens],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politico: { viagens?: Connection<Viagem> } | null }>(
        VIAGENS_DETALHE_QUERY,
        { id: politicoId, anoInicio, anoFim, offsetViagens },
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.politico?.viagens?.nodes?.[0]),
    enabled,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

// Backward-compatible aliases used by existing screens
export function useViagens(
  politicoId?: string,
  pagination?: PaginationInput,
  anoInicio = DEFAULT_ANO_INICIO,
  anoFim = DEFAULT_ANO_FIM
) {
  return useListaViagens(politicoId, {
    anoInicio,
    anoFim,
    pagination,
  });
}

export const useViagensPolitico = useViagens;
