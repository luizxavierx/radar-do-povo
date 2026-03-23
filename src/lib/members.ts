export type MemberStatus = "pending_checkout" | "awaiting_payment" | "active";

export type MemberSession = {
  provider: "google" | "demo";
  name: string;
  email: string;
  picture?: string | null;
  googleSub?: string | null;
  membershipStatus: MemberStatus;
  planSlug: string;
  monthlyRequestLimit: number;
  perSecondLimit: number;
  createdAt: string;
};

export type MemberPixCharge = {
  id: string;
  qrCode: string;
  status: "created" | "paid" | "expired";
  value: number;
  qrCodeImage: string;
  webhookUrl?: string | null;
  endToEndId?: string | null;
  payerName?: string | null;
  payerNationalRegistration?: string | null;
  mode: "mock" | "live";
  createdAt: string;
};

export const MEMBER_STORAGE_KEYS = {
  session: "radar:membros:session",
  pixCharge: "radar:membros:pix-charge",
} as const;

export const MEMBER_PLAN = {
  slug: "membros-radar-mensal",
  name: "Radar do Povo Membros",
  description: "Acesso mensal a endpoints selecionados, documentacao oficial e onboarding guiado.",
  priceCents: 1500,
  priceLabel: "R$ 15/mensal",
  monthlyRequestLimit: 5000,
  perSecondLimit: 1,
} as const;

export const MEMBER_API_BASE_URL =
  import.meta.env.VITE_MEMBER_API_BASE_URL?.trim() || "https://abertos.radardopovo.com/v1";

export const PUSHINPAY_NOTICE =
  "A PUSHIN PAY atua exclusivamente como processadora de pagamentos e nao possui qualquer responsabilidade pela entrega, suporte, conteudo, qualidade ou cumprimento das obrigacoes relacionadas aos produtos ou servicos oferecidos pelo vendedor.";

export function getMemberStatusMeta(status: MemberStatus) {
  if (status === "active") {
    return {
      label: "Acesso ativo",
      description: "Conta liberada para consumo da camada publica de membros.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "awaiting_payment") {
    return {
      label: "Aguardando pagamento",
      description: "Checkout PIX criado. A liberacao completa depende da confirmacao do pagamento.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Cadastro iniciado",
    description: "Conta autenticada. O proximo passo e gerar o PIX mensal para ativar o acesso.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);

  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return decodeURIComponent(
      Array.from(window.atob(padded))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  }

  return "";
}

export function decodeGoogleCredential(credential: string) {
  try {
    const [, payloadPart] = credential.split(".");
    if (!payloadPart) {
      return null;
    }

    const decoded = base64UrlDecode(payloadPart);
    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createMemberSessionFromGoogleCredential(credential: string): MemberSession | null {
  const payload = decodeGoogleCredential(credential);
  if (!payload) {
    return null;
  }

  const name = typeof payload.name === "string" ? payload.name : null;
  const email = typeof payload.email === "string" ? payload.email : null;

  if (!name || !email) {
    return null;
  }

  return {
    provider: "google",
    name,
    email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    googleSub: typeof payload.sub === "string" ? payload.sub : null,
    membershipStatus: "pending_checkout",
    planSlug: MEMBER_PLAN.slug,
    monthlyRequestLimit: MEMBER_PLAN.monthlyRequestLimit,
    perSecondLimit: MEMBER_PLAN.perSecondLimit,
    createdAt: new Date().toISOString(),
  };
}

export function createDemoMemberSession(): MemberSession {
  return {
    provider: "demo",
    name: "Membro Radar",
    email: "membro.demo@radardopovo.com",
    picture:
      "https://api.dicebear.com/9.x/initials/svg?seed=Radar%20do%20Povo&backgroundType=gradientLinear",
    googleSub: null,
    membershipStatus: "pending_checkout",
    planSlug: MEMBER_PLAN.slug,
    monthlyRequestLimit: MEMBER_PLAN.monthlyRequestLimit,
    perSecondLimit: MEMBER_PLAN.perSecondLimit,
    createdAt: new Date().toISOString(),
  };
}

function createPixImageDataUrl(label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480" fill="none">
      <rect width="480" height="480" rx="36" fill="#ffffff"/>
      <rect x="28" y="28" width="424" height="424" rx="28" fill="#0f172a"/>
      <rect x="60" y="60" width="360" height="360" rx="18" fill="#f8fafc"/>
      <rect x="92" y="92" width="72" height="72" rx="10" fill="#0f766e"/>
      <rect x="316" y="92" width="72" height="72" rx="10" fill="#2563eb"/>
      <rect x="92" y="316" width="72" height="72" rx="10" fill="#f59e0b"/>
      <path d="M208 112h44v24h-44zm56 0h44v24h-44zm-56 40h24v24h-24zm40 0h64v24h-64zm80 0h24v24h-24zM208 208h24v24h-24zm40 0h24v24h-24zm40 0h64v24h-64zm-80 40h104v24H208zm120 0h24v24h-24zm-120 40h24v24h-24zm40 0h24v24h-24zm40 0h24v24h-24zm40 0h24v24h-24zm-120 40h64v24h-64zm80 0h64v24h-64z" fill="#0f172a"/>
      <text x="240" y="444" text-anchor="middle" fill="#e2e8f0" font-size="20" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createMockPixCharge(customerName?: string | null): MemberPixCharge {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `pix_${Date.now()}`;
  const reference = customerName?.trim() || "Radar do Povo";
  const qrCode = `00020126580014BR.GOV.BCB.PIX0136radardopovo-members-${id.slice(0, 8)}520400005303986540615.005802BR5925${reference.slice(
    0,
    25
  )}6009SAO PAULO62070503***6304ABCD`;

  return {
    id,
    qrCode,
    status: "created",
    value: MEMBER_PLAN.priceCents,
    webhookUrl: null,
    qrCodeImage: createPixImageDataUrl("PIX R$ 15"),
    endToEndId: null,
    payerName: customerName ?? null,
    payerNationalRegistration: null,
    mode: "mock",
    createdAt: new Date().toISOString(),
  };
}
