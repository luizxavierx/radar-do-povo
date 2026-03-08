import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  EMENDAS_POLITICO_QUERY,
  POLITICO_RESUMO_FINANCEIRO_QUERY,
} from "@/api/queries";
import type {
  Connection,
  Emenda,
  EmendaFiltroInput,
  EmendasResumo,
  GastosAgregados,
  PaginationInput,
  PoliticoFinanceiroResumo,
} from "@/api/types";
import {
  normalizePagination,
  paginatedQueryDefaults,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "./queryShared";

const DEFAULT_PERIOD = { anoInicio: 2019, anoFim: 2026 };

export function usePoliticoResumoFinanceiro(
  politicoId?: string,
  filtro?: EmendaFiltroInput
) {
  const periodo = filtro || DEFAULT_PERIOD;

  return useQuery({
    queryKey: ["politico-resumo-financeiro", politicoId, periodo],
    queryFn: ({ signal }) =>
      graphqlRequest<{
        gastosPolitico: GastosAgregados;
        emendasResumoPolitico: EmendasResumo;
      }>(
        POLITICO_RESUMO_FINANCEIRO_QUERY,
        {
          gastosInput: { politicoId, filtro: periodo },
          emendasInput: { politicoId, filtro: periodo },
        },
        { signal, timeoutMs: 12_000 }
      ).then(
        (d): PoliticoFinanceiroResumo => ({
          gastos: d.gastosPolitico,
          emendasResumo: d.emendasResumoPolitico,
        })
      ),
    enabled: Boolean(politicoId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useEmendas(
  politicoId?: string,
  pagination?: PaginationInput,
  filtro?: EmendaFiltroInput
) {
  const normalizedPagination = normalizePagination(pagination);
  const periodo = filtro || DEFAULT_PERIOD;

  return useQuery({
    queryKey: ["emendas-politico", politicoId, normalizedPagination, periodo],
    queryFn: ({ signal }) =>
      graphqlRequest<{ emendasPolitico: Connection<Emenda> }>(
        EMENDAS_POLITICO_QUERY,
        {
          input: { politicoId, filtro: periodo },
          pagination: normalizedPagination,
        },
        { signal }
      ).then((d) => d.emendasPolitico),
    enabled: Boolean(politicoId),
    ...paginatedQueryDefaults,
  });
}

// Backward-compatible aliases
export const useEmendasPolitico = useEmendas;

export function useEmendasResumoPolitico(
  politicoId?: string,
  filtro?: EmendaFiltroInput
) {
  return useQuery({
    queryKey: ["emendas-resumo", politicoId, filtro || DEFAULT_PERIOD],
    queryFn: ({ signal }) =>
      graphqlRequest<{ emendasResumoPolitico: EmendasResumo }>(
        POLITICO_RESUMO_FINANCEIRO_QUERY,
        {
          gastosInput: { politicoId, filtro: filtro || DEFAULT_PERIOD },
          emendasInput: { politicoId, filtro: filtro || DEFAULT_PERIOD },
        },
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.emendasResumoPolitico),
    enabled: Boolean(politicoId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useGastosPolitico(
  politicoId?: string,
  anoInicio = 2019,
  anoFim = 2026
) {
  return useQuery({
    queryKey: ["gastos-politico", politicoId, anoInicio, anoFim],
    queryFn: ({ signal }) =>
      graphqlRequest<{ gastosPolitico: GastosAgregados }>(
        POLITICO_RESUMO_FINANCEIRO_QUERY,
        {
          gastosInput: { politicoId, filtro: { anoInicio, anoFim } },
          emendasInput: { politicoId, filtro: { anoInicio, anoFim } },
        },
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.gastosPolitico),
    enabled: Boolean(politicoId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
