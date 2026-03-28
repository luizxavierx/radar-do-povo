import { ApiRequestError } from "./requestError";
import { RADAR_API_ROOT } from "./graphqlClient";
const REQUEST_TIMEOUT = 15_000;
const DEFAULT_RETRIES = 1;

export interface RestRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  params?: Record<string, string | number | boolean | undefined | null>;
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

function shouldRetry(error: ApiRequestError): boolean {
  if (error.message.startsWith("Timeout:")) {
    return false;
  }
  if (typeof error.statusCode === "number") {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return true;
}

function withQueryParams(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const url = new URL(path.startsWith("/") ? `${RADAR_API_ROOT}${path}` : `${RADAR_API_ROOT}/${path}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function restRequest<TData>(
  path: string,
  options?: RestRequestOptions
): Promise<TData> {
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT;
  const maxRetries = Math.min(Math.max(options?.retries ?? DEFAULT_RETRIES, 0), 1);
  const requestId = createRequestId();
  const url = withQueryParams(path, options?.params);

  let attempt = 0;
  while (true) {
    const { signal, cleanup, didTimeout } = mergeWithTimeoutSignal(options?.signal, timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Request-ID": requestId,
      };

      const res = await fetch(url, {
        method: "GET",
        headers,
        signal,
      });

      let json: Record<string, unknown> | null = null;
      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch {
        json = null;
      }

      const responseRequestId =
        res.headers.get("x-request-id") ||
        (typeof json?.request_id === "string" ? json.request_id : undefined) ||
        requestId;

      if (!res.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : `HTTP ${res.status}: ${res.statusText}`;

        throw new ApiRequestError(message, {
          requestId: responseRequestId,
          statusCode: res.status,
        });
      }

      if (json === null) {
        throw new ApiRequestError("Resposta vazia da API", { requestId: responseRequestId });
      }

      return json as TData;
    } catch (err) {
      if ((err as Error).name === "AbortError" && options?.signal?.aborted && !didTimeout()) {
        throw err;
      }

      const parsed =
        err instanceof ApiRequestError
          ? err
          : new ApiRequestError(
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
