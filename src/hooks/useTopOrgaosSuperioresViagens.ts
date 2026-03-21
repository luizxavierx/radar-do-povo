import { useQuery } from "@tanstack/react-query";
import type { PaginationInput, RankingViagemFiltroInput } from "@/api/types";
import {
  fetchTopOrgaosSuperioresViagens,
  normalizeViagensFilter,
} from "@/services/viagensService";
import {
  normalizePagination,
  paginatedQueryDefaults,
} from "@/hooks/queryShared";

export function useTopOrgaosSuperioresViagens(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput,
  options?: { enabled?: boolean }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 10);

  return useQuery({
    queryKey: ["top-orgaos-superiores-viagens", normalizedFilter, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchTopOrgaosSuperioresViagens(normalizedFilter, normalizedPagination, { signal }),
    enabled: options?.enabled ?? true,
    ...paginatedQueryDefaults,
  });
}
