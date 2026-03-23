import {
  createDemoMemberSession,
  createMemberSessionFromGoogleCredential,
  createMockPixCharge,
  MEMBER_PLAN,
  MEMBER_STORAGE_KEYS,
  type MemberPixCharge,
  type MemberSession,
} from "@/lib/members";

type CreatePixChargeInput = {
  payerName?: string | null;
  payerEmail?: string | null;
};

type PushinPayPixResponse = {
  id: string;
  qr_code: string;
  status: "created" | "paid" | "expired";
  value: number;
  webhook_url?: string | null;
  qr_code_base64?: string | null;
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
};

const MEMBER_PIX_ENDPOINT = import.meta.env.VITE_MEMBER_PIX_ENDPOINT?.trim() || "";
const MEMBER_PIX_MOCK =
  (import.meta.env.VITE_MEMBER_PIX_MOCK ?? "true").toLowerCase() !== "false";

function readJsonFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredMemberSession() {
  return readJsonFromStorage<MemberSession>(MEMBER_STORAGE_KEYS.session);
}

export function storeMemberSession(session: MemberSession) {
  writeJsonToStorage(MEMBER_STORAGE_KEYS.session, session);
}

export function updateStoredMemberSession(
  updater: (session: MemberSession) => MemberSession
): MemberSession | null {
  const current = getStoredMemberSession();
  if (!current) {
    return null;
  }

  const nextSession = updater(current);
  storeMemberSession(nextSession);
  return nextSession;
}

export function clearStoredMemberSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MEMBER_STORAGE_KEYS.session);
}

export function getStoredPixCharge() {
  return readJsonFromStorage<MemberPixCharge>(MEMBER_STORAGE_KEYS.pixCharge);
}

export function storePixCharge(charge: MemberPixCharge) {
  writeJsonToStorage(MEMBER_STORAGE_KEYS.pixCharge, charge);
}

export function clearStoredPixCharge() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MEMBER_STORAGE_KEYS.pixCharge);
}

export function signInWithGoogleCredential(credential: string) {
  const session = createMemberSessionFromGoogleCredential(credential);
  if (!session) {
    throw new Error("Nao foi possivel validar o retorno do Google.");
  }

  clearStoredPixCharge();
  storeMemberSession(session);
  return session;
}

export function signInDemoMember() {
  const session = createDemoMemberSession();
  clearStoredPixCharge();
  storeMemberSession(session);
  return session;
}

function mapPushinPayResponse(payload: PushinPayPixResponse): MemberPixCharge {
  return {
    id: payload.id,
    qrCode: payload.qr_code,
    status: payload.status,
    value: payload.value,
    webhookUrl: payload.webhook_url ?? null,
    qrCodeImage: payload.qr_code_base64 || createMockPixCharge(payload.payer_name).qrCodeImage,
    endToEndId: payload.end_to_end_id ?? null,
    payerName: payload.payer_name ?? null,
    payerNationalRegistration: payload.payer_national_registration ?? null,
    mode: "live",
    createdAt: new Date().toISOString(),
  };
}

export async function createPixCharge({
  payerName,
  payerEmail,
}: CreatePixChargeInput): Promise<MemberPixCharge> {
  if (!MEMBER_PIX_ENDPOINT || MEMBER_PIX_MOCK) {
    const mockCharge = createMockPixCharge(payerName);
    storePixCharge(mockCharge);
    return mockCharge;
  }

  const response = await fetch(MEMBER_PIX_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: MEMBER_PLAN.priceCents,
      plan_slug: MEMBER_PLAN.slug,
      payer_name: payerName,
      payer_email: payerEmail,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Nao foi possivel gerar o PIX agora.");
  }

  const payload = (await response.json()) as PushinPayPixResponse;
  const charge = mapPushinPayResponse(payload);
  storePixCharge(charge);
  return charge;
}
