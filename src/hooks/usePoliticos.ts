import { useQuery } from "@tanstack/react-query";
import { graphqlRequest, checkApiHealth } from "@/api/graphqlClient";
import {
  HEALTH_QUERY,
  POLITICOS_LIST_QUERY,
  POLITICO_DETALHE_QUERY,
  GASTOS_POLITICO_QUERY,
  VIAGENS_POLITICO_QUERY,
  EMENDAS_RESUMO_POLITICO_QUERY,
  EMENDAS_POLITICO_QUERY,
  TOP_GASTADORES_EMENDAS_ANO_QUERY,
  TOP_DEPUTADOS_EMENDAS_QUERY,
  TOP_SENADORES_EMENDAS_QUERY,
  TOP_EMENDAS_POR_PAIS_ANO_QUERY,
  TOP_GASTADORES_EMENDAS_QUERY,
} from "@/api/queries";
import type {
  Connection,
  PoliticoResumo,
  PoliticoDetalhe,
  PoliticoFilterInput,
  PaginationInput,
  GastosAgregados,
  Viagem,
  Emenda,
  EmendasResumo,
  EmendaFiltroInput,
  TopGastadorEmenda,
  TopEmendaPais,
  RankingEmendaFiltroInput,
  HealthStatus,
} from "@/api/types";

export interface ApiHealthSnapshot extends HealthStatus {
  via: "graphql" | "healthz";
}

const DEFAULT_PERIOD = { anoInicio: 2019, anoFim: 2026 };

export function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{ health: HealthStatus }>(HEALTH_QUERY);
        return { ...data.health, via: "graphql" } as ApiHealthSnapshot;
      } catch {
        const reachable = await checkApiHealth();
        return {
          status: reachable ? "degraded" : "offline",
          timestamp: new Date().toISOString(),
          via: "healthz",
        } as ApiHealthSnapshot;
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function usePoliticos(filter?: PoliticoFilterInput, pagination?: PaginationInput) {
  const hasFilter = Boolean(
    filter?.search?.trim() || filter?.partido?.trim() || filter?.uf?.trim() || filter?.cargoAtual?.trim()
  );

  return useQuery({
    queryKey: ["politicos", filter, pagination],
    queryFn: () =>
      graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
        POLITICOS_LIST_QUERY,
        { filter, pagination }
      ).then((d) => d.politicos),
    enabled: hasFilter,
    staleTime: 5 * 60_000,
  });
}

export function usePoliticoDetalhe(idOrNome?: { id?: string; nomeCanonico?: string }) {
  return useQuery({
    queryKey: ["politico-detalhe", idOrNome],
    queryFn: () =>
      graphqlRequest<{ politico: PoliticoDetalhe }>(POLITICO_DETALHE_QUERY, idOrNome).then(
        (d) => d.politico
      ),
    enabled: Boolean(idOrNome?.id || idOrNome?.nomeCanonico),
    staleTime: 5 * 60_000,
  });
}

export function useGastosPolitico(politicoId?: string, anoInicio = 2019, anoFim = 2026) {
  return useQuery({
    queryKey: ["gastos-politico", politicoId, anoInicio, anoFim],
    queryFn: () =>
      graphqlRequest<{ gastosPolitico: GastosAgregados }>(GASTOS_POLITICO_QUERY, {
        input: { politicoId, filtro: { anoInicio, anoFim } },
      }).then((d) => d.gastosPolitico),
    enabled: Boolean(politicoId),
    staleTime: 5 * 60_000,
  });
}

export function useViagensPolitico(
  politicoId?: string,
  pagination?: PaginationInput,
  anoInicio = 2019,
  anoFim = 2026
) {
  return useQuery({
    queryKey: ["viagens-politico", politicoId, pagination, anoInicio, anoFim],
    queryFn: () =>
      graphqlRequest<{ viagensPolitico: Connection<Viagem> }>(VIAGENS_POLITICO_QUERY, {
        input: { politicoId, anoInicio, anoFim },
        pagination,
      }).then((d) => d.viagensPolitico),
    enabled: Boolean(politicoId),
    staleTime: 5 * 60_000,
  });
}

export function useEmendasResumoPolitico(politicoId?: string, filtro?: EmendaFiltroInput) {
  return useQuery({
    queryKey: ["emendas-resumo", politicoId, filtro],
    queryFn: () =>
      graphqlRequest<{ emendasResumoPolitico: EmendasResumo }>(EMENDAS_RESUMO_POLITICO_QUERY, {
        input: { politicoId, filtro: filtro || DEFAULT_PERIOD },
      }).then((d) => d.emendasResumoPolitico),
    enabled: Boolean(politicoId),
    staleTime: 5 * 60_000,
  });
}

export function useEmendasPolitico(
  politicoId?: string,
  pagination?: PaginationInput,
  filtro?: EmendaFiltroInput
) {
  return useQuery({
    queryKey: ["emendas-politico", politicoId, pagination, filtro],
    queryFn: () =>
      graphqlRequest<{ emendasPolitico: Connection<Emenda> }>(EMENDAS_POLITICO_QUERY, {
        input: { politicoId, filtro: filtro || DEFAULT_PERIOD },
        pagination,
      }).then((d) => d.emendasPolitico),
    enabled: Boolean(politicoId),
    staleTime: 5 * 60_000,
  });
}

export function useTopGastadoresAno(ano: number, pagination?: PaginationInput) {
  return useQuery({
    queryKey: ["top-gastadores-ano", ano, pagination],
    queryFn: () =>
      graphqlRequest<{ topGastadoresEmendasAno: { total: number; nodes: TopGastadorEmenda[] } }>(
        TOP_GASTADORES_EMENDAS_ANO_QUERY,
        { ano, pagination }
      ).then((d) => d.topGastadoresEmendasAno),
    staleTime: 5 * 60_000,
  });
}

export function useTopDeputadosAno(ano: number, pagination?: PaginationInput) {
  return useQuery({
    queryKey: ["top-deputados-ano", ano, pagination],
    queryFn: () =>
      graphqlRequest<{ topDeputadosEmendasAno: { total: number; nodes: TopGastadorEmenda[] } }>(
        TOP_DEPUTADOS_EMENDAS_QUERY,
        { ano, pagination }
      ).then((d) => d.topDeputadosEmendasAno),
    staleTime: 5 * 60_000,
  });
}

export function useTopSenadoresAno(ano: number, pagination?: PaginationInput) {
  return useQuery({
    queryKey: ["top-senadores-ano", ano, pagination],
    queryFn: () =>
      graphqlRequest<{ topSenadoresEmendasAno: { total: number; nodes: TopGastadorEmenda[] } }>(
        TOP_SENADORES_EMENDAS_QUERY,
        { ano, pagination }
      ).then((d) => d.topSenadoresEmendasAno),
    staleTime: 5 * 60_000,
  });
}

export function useTopEmendasPorPaisAno(ano: number, pagination?: PaginationInput) {
  return useQuery({
    queryKey: ["top-emendas-pais-ano", ano, pagination],
    queryFn: () =>
      graphqlRequest<{ topEmendasPorPaisAno: Connection<TopEmendaPais> }>(
        TOP_EMENDAS_POR_PAIS_ANO_QUERY,
        { ano, pagination }
      ).then((d) => d.topEmendasPorPaisAno),
    staleTime: 5 * 60_000,
  });
}

export function useTopGastadoresCustom(
  filtro?: RankingEmendaFiltroInput,
  pagination?: PaginationInput
) {
  return useQuery({
    queryKey: ["top-gastadores-custom", filtro, pagination],
    queryFn: () =>
      graphqlRequest<{ topGastadoresEmendas: { total: number; nodes: TopGastadorEmenda[] } }>(
        TOP_GASTADORES_EMENDAS_QUERY,
        { filtro, pagination }
      ).then((d) => d.topGastadoresEmendas),
    staleTime: 5 * 60_000,
  });
}
