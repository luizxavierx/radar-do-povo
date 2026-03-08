import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  POLITICO_CARGO_POR_NOME_QUERY,
  TOP_DEPUTADOS_EMENDAS_QUERY,
  TOP_EMENDAS_POR_PAIS_ANO_QUERY,
  TOP_GASTADORES_EMENDAS_ANO_QUERY,
  TOP_GASTADORES_EMENDAS_QUERY,
  TOP_SENADORES_EMENDAS_QUERY,
} from "@/api/queries";
import type {
  Connection,
  PaginationInput,
  RankingConnection,
  RankingEmendaFiltroInput,
  TopEmendaPais,
  TopGastadorEmenda,
} from "@/api/types";
import {
  normalizePagination,
  paginatedQueryDefaults,
  QUERY_GC_TIME,
} from "./queryShared";

export type CargoParlamentar = "DEPUTADO" | "SENADOR";

export function useTopGastadoresAno(ano: number, pagination?: PaginationInput) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-gastadores-ano", ano, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topGastadoresEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_GASTADORES_EMENDAS_ANO_QUERY,
        { ano, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.topGastadoresEmendasAno),
    ...paginatedQueryDefaults,
  });
}

export function useTopDeputadosAno(ano: number, pagination?: PaginationInput) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-deputados-ano", ano, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topDeputadosEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_DEPUTADOS_EMENDAS_QUERY,
        { ano, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.topDeputadosEmendasAno),
    ...paginatedQueryDefaults,
  });
}

export function useTopSenadoresAno(ano: number, pagination?: PaginationInput) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-senadores-ano", ano, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topSenadoresEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_SENADORES_EMENDAS_QUERY,
        { ano, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.topSenadoresEmendasAno),
    ...paginatedQueryDefaults,
  });
}

export function useTopEmendasPorPaisAno(ano: number, pagination?: PaginationInput) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-emendas-pais-ano", ano, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topEmendasPorPaisAno: Connection<TopEmendaPais> }>(
        TOP_EMENDAS_POR_PAIS_ANO_QUERY,
        { ano, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.topEmendasPorPaisAno),
    ...paginatedQueryDefaults,
  });
}

export function useTopGastadoresCustom(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput
) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-gastadores-custom", filtro, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topGastadoresEmendas: RankingConnection<TopGastadorEmenda> }>(
        TOP_GASTADORES_EMENDAS_QUERY,
        { filtro, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.topGastadoresEmendas),
    ...paginatedQueryDefaults,
  });
}

function normalizeCargo(cargoAtual?: string | null): CargoParlamentar | null {
  const text = (cargoAtual || "").toLowerCase();
  if (!text) return null;
  if (text.includes("deput")) return "DEPUTADO";
  if (text.includes("senad")) return "SENADOR";
  return null;
}

export function useRankingCargoMap(
  nodes: TopGastadorEmenda[],
  enabled = false
) {
  const names = Array.from(
    new Set(nodes.map((item) => item.nomeAutorEmenda).filter(Boolean))
  );

  return useQuery({
    queryKey: ["ranking-cargo-map", names],
    enabled: enabled && names.length > 0,
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        names.map(async (name) => {
          try {
            const data = await graphqlRequest<{
              politicos: Connection<{ cargoAtual?: string }>;
            }>(
              POLITICO_CARGO_POR_NOME_QUERY,
              { search: name },
              { signal, timeoutMs: 8_000, retries: 0 }
            );
            const cargo = normalizeCargo(data.politicos.nodes?.[0]?.cargoAtual);
            return [name, cargo] as const;
          } catch (error) {
            if ((error as Error).name === "AbortError" || signal.aborted) {
              throw error;
            }
            return [name, null] as const;
          }
        })
      );

      return Object.fromEntries(entries) as Record<string, CargoParlamentar | null>;
    },
    staleTime: 6 * 60 * 60_000,
    gcTime: QUERY_GC_TIME,
  });
}

export const useRankings = {
  useTopGastadoresAno,
  useTopDeputadosAno,
  useTopSenadoresAno,
  useTopEmendasPorPaisAno,
  useTopGastadoresCustom,
  useRankingCargoMap,
};
