import { useQuery } from "@tanstack/react-query";
import type { ImpostometroResumo } from "@/api/types";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "./queryShared";
import { fetchImpostometroResumo } from "@/services/impostometroService";

export function useImpostometroResumo() {
  return useQuery<ImpostometroResumo>({
    queryKey: ["impostometro-resumo"],
    queryFn: ({ signal }) => fetchImpostometroResumo({ signal }),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    placeholderData: (previousData) => previousData,
  });
}
