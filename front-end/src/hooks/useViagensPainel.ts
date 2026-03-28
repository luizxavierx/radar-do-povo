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
  pagination?: PaginationInput,
  options?: { includeTotal?: boolean }
) {
  const normalizedFilter = normalizeViagensFilter(filtro);
  const normalizedPagination = normalizePagination(pagination, 20);
  const includeTotal = options?.includeTotal ?? false;

  return useQuery({
    queryKey: ["viagens-painel", normalizedFilter, normalizedPagination, includeTotal],
    queryFn: ({ signal }) =>
      fetchViagensPainel(normalizedFilter, normalizedPagination, { signal, includeTotal }),
    ...paginatedQueryDefaults,
  });
}
