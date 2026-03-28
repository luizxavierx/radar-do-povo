import { useQuery } from "@tanstack/react-query";
import type { PaginationInput, RankingViagemFiltroInput } from "@/api/types";
import {
  fetchTopOrgaosSolicitantesViagens,
  normalizeViagensFilter,
} from "@/services/viagensService";
import {
  normalizePagination,
  paginatedQueryDefaults,
} from "@/hooks/queryShared";

export function useTopOrgaosSolicitantesViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { enabled?: boolean }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 5);

  return useQuery({
    queryKey: ["top-orgaos-solicitantes-viagens", normalizedFilter, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopOrgaosSolicitantesViagens(normalizedFilter, normalizedPagination, {
        signal,
      }),
    enabled: options?.enabled ?? true,
    ...paginatedQueryDefaults,
  });
}
