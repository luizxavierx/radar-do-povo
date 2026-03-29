import { ApiRequestError } from "@/api/requestError";
import { restRequest } from "@/api/restClient";
import type { PoliticoNewsResponse } from "@/api/types";

const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;

export async function fetchPoliticoNews(
  politico: string,
  signal?: AbortSignal,
  limit = 6
): Promise<PoliticoNewsResponse> {
  const cacheKey = buildNewsCacheKey(politico, limit);
  const cached = readCachedNews(cacheKey);
  if (cached && !isExpired(cached.cachedAt)) {
    return cached.payload;
  }

  try {
    const payload = await restRequest<PoliticoNewsResponse>("/api/news", {
      params: {
        politico,
        limit,
      },
      signal,
      timeoutMs: 5_500,
      retries: 0,
    });

    writeCachedNews(cacheKey, payload);
    return payload;
  } catch (error) {
    if (cached) {
      return cached.payload;
    }

    if (error instanceof ApiRequestError) {
      throw new Error("Nao foi possivel atualizar as noticias agora. Tente novamente em instantes.");
    }

    throw error;
  }
}

function buildNewsCacheKey(politico: string, limit: number): string {
  return `radar-news:${politico.trim().toLowerCase()}:${limit}`;
}

function isExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > NEWS_CACHE_TTL_MS;
}

function readCachedNews(
  cacheKey: string
): { cachedAt: number; payload: PoliticoNewsResponse } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      cachedAt?: number;
      payload?: PoliticoNewsResponse;
    };

    if (
      typeof parsed.cachedAt !== "number" ||
      !parsed.payload ||
      !Array.isArray(parsed.payload.items)
    ) {
      return null;
    }

    return {
      cachedAt: parsed.cachedAt,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

function writeCachedNews(cacheKey: string, payload: PoliticoNewsResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        payload,
      })
    );
  } catch {
    // Ignore storage write failures.
  }
}
