import {
  MEMBER_PORTAL_BASE_URL,
  MEMBER_PORTAL_DEMO,
  MEMBER_STORAGE_KEYS,
  type MemberPixCharge,
  type MemberPortalAccount,
  type MemberPortalAuthResponse,
  type MemberPortalRotateKeyResponse,
} from "@/lib/members";

type ErrorPayload = {
  error?: string;
  message?: string;
};

const NORMALIZED_MEMBER_PORTAL_BASE_URL = MEMBER_PORTAL_BASE_URL.replace(/\/+$/, "");

function readFromStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, value);
}

export function getStoredPortalToken() {
  return readFromStorage(MEMBER_STORAGE_KEYS.portalToken);
}

export function storePortalToken(token: string) {
  writeToStorage(MEMBER_STORAGE_KEYS.portalToken, token);
}

export function clearStoredPortalToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(MEMBER_STORAGE_KEYS.portalToken);
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function memberPortalRequest<T>(
  path: string,
  init: RequestInit = {},
  token = getStoredPortalToken()
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${NORMALIZED_MEMBER_PORTAL_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(
      "Nao foi possivel se comunicar com o portal de membros. Verifique a conexao e tente novamente."
    );
  }

  if (!response.ok) {
    const payload = await parseJson<ErrorPayload>(response);
    throw new Error(payload?.message || payload?.error || "Nao foi possivel concluir a operacao.");
  }

  return (await response.json()) as T;
}

export async function signInWithGoogleCredential(credential: string): Promise<MemberPortalAuthResponse> {
  const response = await memberPortalRequest<MemberPortalAuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  }, null);

  storePortalToken(response.token);
  return response;
}

export async function fetchMemberAccount(): Promise<MemberPortalAccount> {
  return memberPortalRequest<MemberPortalAccount>("/me");
}

export async function logoutMember(): Promise<void> {
  const token = getStoredPortalToken();

  try {
    if (token) {
      await memberPortalRequest<{ ok: boolean }>("/auth/logout", { method: "POST" }, token);
    }
  } finally {
    clearStoredPortalToken();
  }
}

export async function createPixCharge(): Promise<MemberPixCharge> {
  return memberPortalRequest<MemberPixCharge>("/billing/pix", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchCurrentPixCharge(): Promise<MemberPixCharge | null> {
  const payload = await memberPortalRequest<{ latestCharge: MemberPixCharge | null }>("/billing/pix/current");
  return payload.latestCharge;
}

export async function rotateMemberApiKey(): Promise<MemberPortalRotateKeyResponse> {
  return memberPortalRequest<MemberPortalRotateKeyResponse>("/api-key/rotate", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function isMemberPortalDemoEnabled() {
  return MEMBER_PORTAL_DEMO;
}
