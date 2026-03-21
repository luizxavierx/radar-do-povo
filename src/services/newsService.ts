import { restRequest } from "@/api/restClient";
import type { PoliticoNewsResponse } from "@/api/types";

export async function fetchPoliticoNews(
  politico: string,
  signal?: AbortSignal,
  limit = 6
): Promise<PoliticoNewsResponse> {
  return restRequest<PoliticoNewsResponse>("/api/news", {
    params: {
      politico,
      limit,
    },
    signal,
    timeoutMs: 12_000,
    retries: 0,
  });
}
