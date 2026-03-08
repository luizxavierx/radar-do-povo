import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import {
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
import { normalizePagination, paginatedQueryDefaults } from "./queryShared";

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

export const useRankings = {
  useTopGastadoresAno,
  useTopDeputadosAno,
  useTopSenadoresAno,
  useTopEmendasPorPaisAno,
  useTopGastadoresCustom,
};
