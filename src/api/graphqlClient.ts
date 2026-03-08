import type { GraphQLResponse, GraphQLError } from "./types";

const API_BASE = "https://api.radardopovo.com";
const GRAPHQL_ENDPOINT = `${API_BASE}/graphql`;
const REQUEST_TIMEOUT = 15_000;

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

export async function graphqlRequest<TData, TVars = Record<string, unknown>>(
  query: string,
  variables?: TVars
): Promise<TData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new GraphQLRequestError(`HTTP ${res.status}: ${res.statusText}`, {
        statusCode: res.status,
      });
    }

    const json: GraphQLResponse<TData> = await res.json();

    if (json.errors?.length) {
      const requestId = json.errors[0]?.extensions?.request_id as string | undefined;
      if (requestId) {
        console.error(`[RadarDoPovo] GraphQL error — request_id: ${requestId}`, json.errors);
      } else {
        console.error("[RadarDoPovo] GraphQL error", json.errors);
      }

      throw new GraphQLRequestError(
        json.errors.map((e) => e.message).join("; "),
        { requestId, graphqlErrors: json.errors }
      );
    }

    if (!json.data) {
      throw new GraphQLRequestError("Resposta vazia da API");
    }

    return json.data;
  } catch (err) {
    if (err instanceof GraphQLRequestError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new GraphQLRequestError("Timeout: a API não respondeu a tempo");
    }
    throw new GraphQLRequestError((err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

/** Health check */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/healthz`, { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  } catch {
    return false;
  }
}
