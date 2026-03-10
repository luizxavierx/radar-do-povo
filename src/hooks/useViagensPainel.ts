import { useQuery } from "@tanstack/react-query";
import type { PaginationInput, RankingViagemFiltroInput } from "@/api/types";
import {
  fetchViagensPainel,
  normalizeViagensFilter,
} from "@/services/viagensService";
import {
  normalizePagination,
  paginatedQueryDefaults,
} from "@/hooks/queryShared";

export function useViagensPainel(
  filtro?: RankingViagemFiltroInput,
  pagination?: PaginationInput
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 20);

  return useQuery({
    queryKey: ["viagens-painel", normalizedFilter, normalizedPagination],
    queryFn: ({ signal }) =>
      fetchViagensPainel(normalizedFilter, normalizedPagination, { signal }),
    ...paginatedQueryDefaults,
  });
}
