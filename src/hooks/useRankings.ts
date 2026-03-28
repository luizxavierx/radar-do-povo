import { useQuery } from "@tanstack/react-query";
import type {
  EmendaRankingResumo,
  EmendaSerieAnualNode,
  EmendaTipoRanking,
  PaginationInput,
  RankingEmendaFiltroInput,
  TopGastadorEmenda,
} from "@/api/types";
import {
  normalizePagination,
  paginatedQueryDefaults,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "./queryShared";
import {
  fetchEmendasResumo,
  fetchEmendasSerieAnual,
  fetchTopEmendasPorPais,
  fetchTopGastadoresEmendas,
  fetchTopTiposEmendas,
} from "@/services/rankingsService";

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
      fetchTopGastadoresEmendas(
        { anoInicio: ano, anoFim: ano, apenasParlamentares: true },
        TOP30_PAGINATION,
        { signal }
      ),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopDeputadosAno(ano: number) {
  return useQuery({
    queryKey: ["top-deputados-ano", ano],
    queryFn: ({ signal }) =>
      fetchTopGastadoresEmendas(
        {
          anoInicio: ano,
          anoFim: ano,
          apenasParlamentares: true,
          cargoParlamentar: "DEPUTADO",
        },
        TOP30_PAGINATION,
        { signal }
      ),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopSenadoresAno(ano: number) {
  return useQuery({
    queryKey: ["top-senadores-ano", ano],
    queryFn: ({ signal }) =>
      fetchTopGastadoresEmendas(
        {
          anoInicio: ano,
          anoFim: ano,
          apenasParlamentares: true,
          cargoParlamentar: "SENADOR",
        },
        TOP30_PAGINATION,
        { signal }
      ),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopGeralAno(ano: number) {
  return useQuery({
    queryKey: ["top-geral-ano", ano],
    queryFn: ({ signal }) =>
      fetchTopGastadoresEmendas(
        { anoInicio: ano, anoFim: ano, apenasParlamentares: false },
        TOP30_PAGINATION,
        { signal }
      ),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useTopEmendasPorPaisAno(ano: number, pagination?: PaginationInput) {
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["top-emendas-pais-ano", ano, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopEmendasPorPais(
        { anoInicio: ano, anoFim: ano, apenasParlamentares: true },
        normalizedPagination,
        { signal }
      ),
    ...paginatedQueryDefaults,
  });
}

export function useEmendaRankingResumo(filtro?: RankingEmendaFiltroInput) {
  return useQuery<EmendaRankingResumo>({
    queryKey: ["emenda-ranking-resumo", filtro],
    queryFn: ({ signal }) => fetchEmendasResumo(filtro, { signal }),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useEmendaSerieAnual(filtro?: RankingEmendaFiltroInput) {
  return useQuery<{ total: number; limit?: number; offset?: number; nodes: EmendaSerieAnualNode[] }>({
    queryKey: ["emenda-serie-anual", filtro],
    queryFn: ({ signal }) => fetchEmendasSerieAnual(filtro, { signal }),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
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
      fetchTopGastadoresEmendas(filtro, normalizedPagination, { signal }),
    ...paginatedQueryDefaults,
  });
}

export function useTopEmendasPorPaisCustom(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput
) {
  const normalizedPagination = normalizePagination(pagination, 10);

  return useQuery({
    queryKey: ["top-emendas-pais-custom", filtro, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopEmendasPorPais(filtro, normalizedPagination, { signal }),
    ...paginatedQueryDefaults,
  });
}

export function useTopTiposCustom(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput
) {
  const normalizedPagination = normalizePagination(pagination, 8);

  return useQuery<{
    total: number;
    limit: number;
    offset: number;
    nodes: EmendaTipoRanking[];
  }>({
    queryKey: ["top-tipos-custom", filtro, normalizedPagination],
    queryFn: ({ signal }) => fetchTopTiposEmendas(filtro, normalizedPagination, { signal }),
    ...paginatedQueryDefaults,
  });
}

