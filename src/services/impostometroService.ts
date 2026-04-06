import { restRequest } from "@/api/restClient";
import type { ImpostometroResumo } from "@/api/types";

const IMPOSTOMETRO_TIMEOUT_MS = 12_000;

export async function fetchImpostometroResumo(options?: { signal?: AbortSignal }) {
  return restRequest<ImpostometroResumo>("/api/impostometro", {
    params: {
      includeTributos: true,
    },
    signal: options?.signal,
    timeoutMs: IMPOSTOMETRO_TIMEOUT_MS,
    retries: 0,
  });
}
