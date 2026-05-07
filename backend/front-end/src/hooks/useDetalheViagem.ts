import { useQuery } from "@tanstack/react-query";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/hooks/queryShared";
import {
  fetchDetalheViagemPorProcesso,
  type ViagemDetalheInput,
} from "@/services/viagensService";

export function useDetalheViagem(
  input?: ViagemDetalheInput,
  enabled = true
) {
  return useQuery({
    queryKey: ["detalhe-viagem-processo", input],
    queryFn: ({ signal }) => fetchDetalheViagemPorProcesso(input as ViagemDetalheInput, { signal }),
    enabled: Boolean(input?.processoId && enabled),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
