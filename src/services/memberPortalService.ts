import {
  MEMBER_PORTAL_BASE_URL,
  type MemberPixCharge,
  type MemberPortalAccount,
  type MemberPortalRotateKeyResponse,
} from "@/lib/members";

type ErrorPayload = {
  error?: string;
  message?: string;
};

const NORMALIZED_MEMBER_PORTAL_BASE_URL = MEMBER_PORTAL_BASE_URL.replace(/\/+$/, "");

export function buildGoogleAuthRedirectUrl(returnTo = "/membros/dashboard"): string {
  const normalizedReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/membros/dashboard";
  const url = new URL(`${NORMALIZED_MEMBER_PORTAL_BASE_URL}/auth/google/redirect`);
  url.searchParams.set("return_to", normalizedReturnTo);

  return url.toString();
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function memberPortalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${NORMALIZED_MEMBER_PORTAL_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
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

export async function fetchMemberAccount(): Promise<MemberPortalAccount> {
  return memberPortalRequest<MemberPortalAccount>("/me");
}

export async function logoutMember(): Promise<void> {
  await memberPortalRequest<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function createPixCharge(): Promise<MemberPixCharge> {
  return memberPortalRequest<MemberPixCharge>("/billing/pix", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchCurrentPixCharge(): Promise<MemberPixCharge | null> {
  const payload = await memberPortalRequest<{ latestCharge: MemberPixCharge | null }>(
    "/billing/pix/current"
  );
  return payload.latestCharge;
}

export async function rotateMemberApiKey(): Promise<MemberPortalRotateKeyResponse> {
  return memberPortalRequest<MemberPortalRotateKeyResponse>("/api-key/rotate", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
