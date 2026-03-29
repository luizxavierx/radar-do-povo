import { useQuery } from "@tanstack/react-query";
import { graphqlRequest, checkApiHealth } from "@/api/graphqlClient";
import { restRequest } from "@/api/restClient";
import { fetchPoliticoNews } from "@/services/newsService";
import {
  FEATURED_POLITICOS_QUERY,
  HEALTH_QUERY,
  POLITICO_BASICO_QUERY,
  POLITICO_PERFIL_EXTERNO_QUERY,
  POLITICOS_LIST_QUERY,
} from "@/api/queries";
import type {
  Connection,
  HealthStatus,
  PerfilExterno,
  PerfilExternoFieldSelection,
  PoliticoDetalhe,
  PoliticoDossieCompleto,
  PoliticoFilterInput,
  PoliticoResumo,
  PaginationInput,
} from "@/api/types";
import {
  normalizePagination,
  paginatedQueryDefaults,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "./queryShared";

export interface ApiHealthSnapshot extends HealthStatus {
  via: "graphql" | "healthz";
}

type FeaturedAlias =
  | "lula"
  | "bolsonaro"
  | "arthurLira"
  | "daviAlcolumbre"
  | "flavioDino"
  | "simoneTebet";

export interface FeaturedPolitico {
  key: FeaturedAlias;
  search: string;
  politico?: PoliticoResumo;
}

const featuredBlueprint: { key: FeaturedAlias; search: string }[] = [
  { key: "lula", search: "lula" },
  { key: "bolsonaro", search: "bolsonaro" },
  { key: "arthurLira", search: "arthur lira" },
  { key: "daviAlcolumbre", search: "davi alcolumbre" },
  { key: "flavioDino", search: "flavio dino" },
  { key: "simoneTebet", search: "simone tebet" },
];

const defaultExternalFieldSelection: Required<PerfilExternoFieldSelection> = {
  camara: true,
  senado: true,
  tse: false,
  lexml: true,
  brasilIo: true,
  wikipedia: true,
};

export function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: async ({ signal }) => {
      try {
        const data = await graphqlRequest<{ health: HealthStatus }>(HEALTH_QUERY, undefined, {
          signal,
          timeoutMs: 8_000,
          retries: 0,
        });
        return { ...data.health, via: "graphql" } as ApiHealthSnapshot;
      } catch (error) {
        if ((error as Error).name === "AbortError" || signal.aborted) {
          throw error;
        }
        const reachable = await checkApiHealth();
        return {
          status: reachable ? "degraded" : "offline",
          timestamp: new Date().toISOString(),
          via: "healthz",
        } as ApiHealthSnapshot;
      }
    },
    staleTime: 60_000,
    gcTime: QUERY_GC_TIME,
    refetchInterval: 120_000,
  });
}

export function usePoliticos(filter?: PoliticoFilterInput, pagination?: PaginationInput) {
  const hasFilter = Boolean(
    filter?.search?.trim() ||
      filter?.partido?.trim() ||
      filter?.uf?.trim() ||
      filter?.cargoAtual?.trim()
  );
  const normalizedPagination = normalizePagination(pagination);

  return useQuery({
    queryKey: ["politicos", filter, normalizedPagination],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
        POLITICOS_LIST_QUERY,
        { filter, pagination: normalizedPagination },
        { signal }
      ).then((d) => d.politicos),
    enabled: hasFilter,
    ...paginatedQueryDefaults,
  });
}

export function usePoliticoDetalhe(idOrNome?: { id?: string; nomeCanonico?: string }) {
  return useQuery({
    queryKey: ["politico-detalhe", idOrNome],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politico: PoliticoDetalhe }>(
        POLITICO_BASICO_QUERY,
        idOrNome,
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.politico),
    enabled: Boolean(idOrNome?.id || idOrNome?.nomeCanonico),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export interface PoliticoDossieQueryOptions {
  anoInicio?: number;
  anoFim?: number;
  viagensLimit?: number;
  viagensOffset?: number;
  emendasLimit?: number;
  emendasOffset?: number;
  lexmlLimit?: number;
  lexmlOffset?: number;
  passagensLimit?: number;
  pagamentosLimit?: number;
  trechosLimit?: number;
  conveniosLimit?: number;
  favorecidosLimit?: number;
  includePerfilExterno?: boolean;
  includeGastos?: boolean;
  includeEmendasResumo?: boolean;
  includeViagens?: boolean;
  includeEmendas?: boolean;
  includePassagens?: boolean;
  includePagamentos?: boolean;
  includeTrechos?: boolean;
  includeConvenios?: boolean;
  includeFavorecidos?: boolean;
  includeCamara?: boolean;
  includeSenado?: boolean;
  includeLexml?: boolean;
  includeBrasilIo?: boolean;
  includeWikipedia?: boolean;
  includeTse?: boolean;
}

export function usePoliticoDossieCompleto(
  nome?: string,
  options: PoliticoDossieQueryOptions = {}
) {
  const search = (nome || "").trim();
  const normalized = {
    anoInicio: options.anoInicio ?? 2019,
    anoFim: options.anoFim ?? new Date().getFullYear(),
    viagensLimit: options.viagensLimit ?? 20,
    viagensOffset: options.viagensOffset ?? 0,
    emendasLimit: options.emendasLimit ?? 20,
    emendasOffset: options.emendasOffset ?? 0,
    lexmlLimit: options.lexmlLimit ?? 10,
    lexmlOffset: options.lexmlOffset ?? 0,
    passagensLimit: options.passagensLimit ?? 12,
    pagamentosLimit: options.pagamentosLimit ?? 12,
    trechosLimit: options.trechosLimit ?? 12,
    conveniosLimit: options.conveniosLimit ?? 12,
    favorecidosLimit: options.favorecidosLimit ?? 12,
    includePerfilExterno: options.includePerfilExterno ?? true,
    includeGastos: options.includeGastos ?? true,
    includeEmendasResumo: options.includeEmendasResumo ?? true,
    includeViagens: options.includeViagens ?? true,
    includeEmendas: options.includeEmendas ?? true,
    includePassagens: options.includePassagens ?? true,
    includePagamentos: options.includePagamentos ?? true,
    includeTrechos: options.includeTrechos ?? true,
    includeConvenios: options.includeConvenios ?? true,
    includeFavorecidos: options.includeFavorecidos ?? true,
    includeCamara: options.includeCamara ?? true,
    includeSenado: options.includeSenado ?? true,
    includeLexml: options.includeLexml ?? true,
    includeBrasilIo: options.includeBrasilIo ?? true,
    includeWikipedia: options.includeWikipedia ?? true,
    includeTse: options.includeTse ?? false,
  };

  return useQuery({
    queryKey: ["politico-dossie-completo", search, normalized],
    queryFn: ({ signal }) =>
      restRequest<PoliticoDossieCompleto>(
        `/api/politicos/${encodeURIComponent(search)}/dossie`,
        {
          params: normalized,
          signal,
          timeoutMs: 20_000,
          retries: 0,
        }
      ),
    enabled: Boolean(search),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function usePoliticoPerfilExterno(
  politicoId?: string,
  fields?: PerfilExternoFieldSelection
) {
  const selection = { ...defaultExternalFieldSelection, ...fields };

  return useQuery({
    queryKey: ["politico-perfil-externo", politicoId, selection],
    queryFn: ({ signal }) =>
      graphqlRequest<{ politico: { perfilExterno?: PerfilExterno } }>(
        POLITICO_PERFIL_EXTERNO_QUERY,
        {
          id: politicoId,
          includeCamara: selection.camara,
          includeSenado: selection.senado,
          includeTse: selection.tse,
          includeLexml: selection.lexml,
          includeBrasilIo: selection.brasilIo,
          includeWikipedia: selection.wikipedia,
        },
        { signal, timeoutMs: 12_000 }
      ).then((d) => d.politico?.perfilExterno),
    enabled: Boolean(politicoId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useFeaturedPoliticos() {
  return useQuery({
    queryKey: ["featured-politicos"],
    queryFn: ({ signal }) =>
      graphqlRequest<Record<FeaturedAlias, PoliticoResumo | null>>(
        FEATURED_POLITICOS_QUERY,
        undefined,
        { signal, timeoutMs: 10_000 }
      ).then((data) =>
        featuredBlueprint.map(({ key, search }) => ({
          key,
          search,
          politico: data[key] || undefined,
        }))
      ),
    staleTime: 15 * 60_000,
    gcTime: QUERY_GC_TIME,
  });
}

export function usePoliticoNoticias(nome?: string, limit = 6) {
  const search = (nome || "").trim();

  return useQuery({
    queryKey: ["politico-noticias", search, limit],
    queryFn: ({ signal }) => fetchPoliticoNews(search, signal, limit),
    enabled: Boolean(search),
    retry: 1,
    placeholderData: (previousData) => previousData,
    staleTime: 10 * 60_000,
    gcTime: QUERY_GC_TIME,
  });
}
