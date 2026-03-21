import type { GraphQLResponse, GraphQLError } from "./types";

const RAW_RADAR_API_BASE = __RADAR_API_BASE__.replace(/\/+$/, "");
const RADAR_API_ROOT = RAW_RADAR_API_BASE.replace(/\/graphql\/?$/, "");
const GRAPHQL_ENDPOINT = /\/graphql\/?$/.test(RAW_RADAR_API_BASE)
  ? RAW_RADAR_API_BASE
  : `${RAW_RADAR_API_BASE}/graphql`;
const HEALTH_ENDPOINTS = [`${RADAR_API_ROOT}/healthz`];
const REQUEST_TIMEOUT = 15_000;
const DEFAULT_RETRIES = 1;

export class GraphQLRequestError extends Error {
  public requestId?: string;
  public graphqlErrors?: GraphQLError[];
  public statusCode?: number;

  constructor(
    message: string,
    opts?: { requestId?: string; graphqlErrors?: GraphQLError[]; statusCode?: number }
  ) {
    super(message);
    this.name = "GraphQLRequestError";
    this.requestId = opts?.requestId;
    this.graphqlErrors = opts?.graphqlErrors;
    this.statusCode = opts?.statusCode;
  }
}

export interface GraphQLRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeWithTimeoutSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void; didTimeout: () => boolean } {
  const controller = new AbortController();
  let timeoutReached = false;

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => {
    timeoutReached = true;
    controller.abort(new DOMException("Timeout", "AbortError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
    didTimeout: () => timeoutReached,
  };
}

function shouldRetry(error: GraphQLRequestError): boolean {
  if (error.graphqlErrors?.length) {
    return false;
  }
  if (typeof error.statusCode === "number") {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return true;
}

export async function graphqlRequest<TData, TVars = Record<string, unknown>>(
  query: string,
  variables?: TVars,
  options?: GraphQLRequestOptions
): Promise<TData> {
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT;
  const maxRetries = Math.min(Math.max(options?.retries ?? DEFAULT_RETRIES, 0), 1);
  const requestId = createRequestId();

  let attempt = 0;
  while (true) {
    const { signal, cleanup, didTimeout } = mergeWithTimeoutSignal(options?.signal, timeoutMs);

    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ query, variables }),
        signal,
      });

      let json: GraphQLResponse<TData> | null = null;
      try {
        json = (await res.json()) as GraphQLResponse<TData>;
      } catch {
        json = null;
      }
      const responseRequestId = res.headers.get("x-request-id") || requestId;

      if (!res.ok) {
        throw new GraphQLRequestError(`HTTP ${res.status}: ${res.statusText}`, {
          statusCode: res.status,
          requestId: responseRequestId,
        });
      }

      if (json?.errors?.length) {
        const graphqlRequestId =
          (json.errors[0]?.extensions?.request_id as string | undefined) || responseRequestId;

        console.error(`[RadarDoPovo] GraphQL error - request_id: ${graphqlRequestId}`, json.errors);
        throw new GraphQLRequestError(json.errors.map((e) => e.message).join("; "), {
          requestId: graphqlRequestId,
          graphqlErrors: json.errors,
        });
      }

      if (!json?.data) {
        throw new GraphQLRequestError("Resposta vazia da API", { requestId: responseRequestId });
      }

      return json.data;
    } catch (err) {
      if ((err as Error).name === "AbortError" && options?.signal?.aborted && !didTimeout()) {
        throw err;
      }

      const parsed =
        err instanceof GraphQLRequestError
          ? err
          : new GraphQLRequestError(
              (err as Error).name === "AbortError"
                ? "Timeout: a API nao respondeu a tempo"
                : (err as Error).message,
              { requestId }
            );

      if (attempt < maxRetries && shouldRetry(parsed)) {
        attempt += 1;
        continue;
      }

      throw parsed;
    } finally {
      cleanup();
    }
  }
}

/** Health check */
export async function checkApiHealth(): Promise<boolean> {
  for (const endpoint of HEALTH_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);

    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      if (res.ok) return true;
    } catch {
      // Try the next fallback endpoint.
    } finally {
      clearTimeout(timer);
    }
  }

  return false;
}
