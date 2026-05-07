import { useQuery } from "@tanstack/react-query";
import type { RankingViagemFiltroInput } from "@/api/types";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/hooks/queryShared";
import {
  fetchResumoViagens,
  normalizeViagensFilter,
} from "@/services/viagensService";

export function useResumoViagens(filtro?: RankingViagemFiltroInput) {
  const normalizedFilter = normalizeViagensFilter(filtro);

  return useQuery({
    queryKey: ["viagens-resumo", normalizedFilter],
    queryFn: ({ signal }) => fetchResumoViagens(normalizedFilter, { signal }),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
