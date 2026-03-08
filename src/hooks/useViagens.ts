import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/api/graphqlClient";
import { VIAGENS_POLITICO_QUERY } from "@/api/queries";
import type { Connection, PaginationInput, Viagem } from "@/api/types";
import { normalizePagination, paginatedQueryDefaults } from "./queryShared";

export function useViagens(
  politicoId?: string,
  pagination?: PaginationInput,
  anoInicio = 2019,
  anoFim = 2026
) {
  const normalizedPagination = normalizePagination(pagination);

  return useQuery({
    queryKey: ["viagens-politico", politicoId, normalizedPagination, anoInicio, anoFim],
    queryFn: ({ signal }) =>
      graphqlRequest<{ viagensPolitico: Connection<Viagem> }>(
        VIAGENS_POLITICO_QUERY,
        {
          input: { politicoId, anoInicio, anoFim },
          pagination: normalizedPagination,
        },
        { signal }
      ).then((d) => d.viagensPolitico),
    enabled: Boolean(politicoId),
    ...paginatedQueryDefaults,
  });
}

// Backward-compatible alias
export const useViagensPolitico = useViagens;
