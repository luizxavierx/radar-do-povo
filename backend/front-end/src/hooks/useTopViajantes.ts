import { useQuery } from "@tanstack/react-query";
import type { PaginationInput, RankingViagemFiltroInput } from "@/api/types";
import {
  fetchTopViajantes,
  normalizeViagensFilter,
} from "@/services/viagensService";
import {
  normalizePagination,
  paginatedQueryDefaults,
} from "@/hooks/queryShared";

export function useTopViajantes(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { enabled?: boolean }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 10);

  return useQuery({
    queryKey: ["top-viajantes", normalizedFilter, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopViajantes(normalizedFilter, normalizedPagination, { signal }),
    enabled: options?.enabled ?? true,
    ...paginatedQueryDefaults,
  });
}
