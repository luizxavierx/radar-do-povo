import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  TOP_DEPUTADOS_EMENDAS_QUERY,
  TOP_EMENDAS_POR_PAIS_ANO_QUERY,
  TOP_GASTADORES_EMENDAS_ANO_QUERY,
  TOP_GASTADORES_EMENDAS_QUERY,
  TOP_GERAL_ANO_QUERY,
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
  QUERY_STALE_TIME,
} from "./queryShared";

const TOP30_PAGINATION = { limit: 30, offset: 0 } as const;

function normalizeAutorName(value?: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function isBancadaNome(nomeAutorEmenda?: string): boolean {
  const normalized = normalizeAutorName(nomeAutorEmenda);
  return /\b(BANCADA|COMISSAO|BLOCO|PARTIDO)\b/.test(normalized);
}

export function filtrarBancadas<T extends { nomeAutorEmenda?: string }>(nodes: T[]): T[] {
  return nodes.filter((node) => isBancadaNome(node.nomeAutorEmenda));
}

export function useTopGastadoresAno(ano: number) {
  return useQuery({
    queryKey: ["top-gastadores-ano", ano],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topGastadoresEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_GASTADORES_EMENDAS_ANO_QUERY,
        { ano, pagination: TOP30_PAGINATION },
        { signal }
      ).then((d) => d.topGastadoresEmendasAno),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopDeputadosAno(ano: number) {
  return useQuery({
    queryKey: ["top-deputados-ano", ano],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topDeputadosEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_DEPUTADOS_EMENDAS_QUERY,
        { ano, pagination: TOP30_PAGINATION },
        { signal }
      ).then((d) => d.topDeputadosEmendasAno),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopSenadoresAno(ano: number) {
  return useQuery({
    queryKey: ["top-senadores-ano", ano],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topSenadoresEmendasAno: RankingConnection<TopGastadorEmenda> }>(
        TOP_SENADORES_EMENDAS_QUERY,
        { ano, pagination: TOP30_PAGINATION },
        { signal }
      ).then((d) => d.topSenadoresEmendasAno),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopGeralAno(ano: number) {
  return useQuery({
    queryKey: ["top-geral-ano", ano],
    queryFn: ({ signal }) =>
      graphqlRequest<{ topGastadoresEmendas: RankingConnection<TopGastadorEmenda> }>(
        TOP_GERAL_ANO_QUERY,
        { ano, pagination: TOP30_PAGINATION },
        { signal }
      ).then((d) => d.topGastadoresEmendas),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
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

