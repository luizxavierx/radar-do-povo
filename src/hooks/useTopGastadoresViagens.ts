import { useQuery } from "@tanstack/react-query";
import type { PaginationInput, RankingViagemFiltroInput } from "@/api/types";
import {
  fetchTopGastadoresViagens,
  normalizeViagensFilter,
} from "@/services/viagensService";
import {
  normalizePagination,
  paginatedQueryDefaults,
} from "@/hooks/queryShared";

export function useTopGastadoresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { enabled?: boolean }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 10);

  return useQuery({
    queryKey: ["top-gastadores-viagens", normalizedFilter, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopGastadoresViagens(normalizedFilter, normalizedPagination, { signal }),
    enabled: options?.enabled ?? true,
    ...paginatedQueryDefaults,
  });
}
