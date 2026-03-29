import { ApiRequestError } from "@/api/requestError";
import { restRequest } from "@/api/restClient";
import type { PoliticoNewsResponse } from "@/api/types";

export async function fetchPoliticoNews(
  politico: string,
  signal?: AbortSignal,
  limit = 6
): Promise<PoliticoNewsResponse> {
  try {
    return await restRequest<PoliticoNewsResponse>("/api/news", {
      params: {
        politico,
        limit,
      },
      signal,
      timeoutMs: 8_000,
      retries: 1,
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new Error("Nao foi possivel atualizar as noticias agora. Tente novamente em instantes.");
    }

    throw error;
  }
}
