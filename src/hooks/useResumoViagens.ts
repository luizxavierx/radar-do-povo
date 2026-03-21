import { useQuery } from "@tanstack/react-query";
import type { RankingViagemFiltroInput } from "@/api/types";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/hooks/queryShared";
import {
  fetchResumoViagens,
  normalizeViagensFilter,
} from "@/services/viagensService";

export function useResumoViagens(
  filtro?: RankingViagemFiltroInput,
  options?: {
    enabled?: boolean;
    includePagamentos?: boolean;
    includeTrechos?: boolean;
  }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const includePagamentos = options?.includePagamentos ?? true;
  const includeTrechos = options?.includeTrechos ?? true;

  return useQuery({
    queryKey: ["viagens-resumo", normalizedFilter, includePagamentos, includeTrechos],
    queryFn: ({ signal }) =>
      fetchResumoViagens(normalizedFilter, {
        signal,
        includePagamentos,
        includeTrechos,
      }),
    enabled: options?.enabled ?? true,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
