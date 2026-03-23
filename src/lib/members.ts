export type MemberStatus = "pending_checkout" | "awaiting_payment" | "active";

export type MemberPortalUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  googleSub?: string | null;
  status: string;
  planSlug: string;
  monthlyRequestLimit: number;
  portalLastLoginAt?: string | null;
  apiAccessStartsAt?: string | null;
  apiAccessEndsAt?: string | null;
  lastApiRequestAt?: string | null;
};

export type MemberPortalMembership = {
  status: MemberStatus;
  isActive: boolean;
  planSlug: string;
  planName: string;
  priceCents: number;
  priceLabel: string;
  monthlyRequestLimit: number;
  perSecondLimit: number;
  currentPeriodEndsAt?: string | null;
};

export type MemberPortalUsage = {
  month: string;
  used: number;
  limit: number;
  remaining: number;
};

export type MemberPortalApiKey = {
  exists: boolean;
  prefix?: string | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  plainTextKey?: string | null;
};

export type MemberPixCharge = {
  id: string;
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  webhookUrl?: string | null;
  endToEndId?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
  payerNationalRegistration?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MemberPortalAccount = {
  user: MemberPortalUser;
  membership: MemberPortalMembership;
  usage: MemberPortalUsage;
  apiKey: MemberPortalApiKey;
  latestCharge: MemberPixCharge | null;
};

export type MemberPortalAuthResponse = {
  token: string;
  tokenType: string;
  account: MemberPortalAccount;
};

export type MemberPortalRotateKeyResponse = {
  issuedKey: {
    prefix: string;
    plainTextKey: string;
    generatedAt: string;
  };
  account: MemberPortalAccount;
};

export const MEMBER_STORAGE_KEYS = {
  portalToken: "radar:membros:portal-token",
} as const;

export const MEMBER_API_BASE_URL =
  import.meta.env.VITE_MEMBER_API_BASE_URL?.trim() || "https://abertos.radardopovo.com/v1";

export const MEMBER_PORTAL_BASE_URL =
  import.meta.env.VITE_MEMBER_PORTAL_BASE_URL?.trim() ||
  "https://api.radardopovo.com/api/member/portal";

export const MEMBER_PORTAL_DEMO =
  (import.meta.env.VITE_MEMBER_PORTAL_DEMO ?? "false").toLowerCase() === "true";

export const DEFAULT_MEMBER_PLAN = {
  slug: "membros-radar-mensal",
  name: "Radar do Povo Membros",
  priceCents: 1500,
  priceLabel: "R$ 15/mensal",
  monthlyRequestLimit: 5000,
  perSecondLimit: 1,
} as const;

export const PUSHINPAY_NOTICE =
  "A PUSHIN PAY atua exclusivamente como processadora de pagamentos e nao possui qualquer responsabilidade pela entrega, suporte, conteudo, qualidade ou cumprimento das obrigacoes relacionadas aos produtos ou servicos oferecidos pelo vendedor.";

export function getMemberStatusMeta(status: MemberStatus) {
  if (status === "active") {
    return {
      label: "Acesso ativo",
      description: "Plano confirmado e liberado para gerar ou rotacionar a API key unica do membro.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "awaiting_payment") {
    return {
      label: "Aguardando pagamento",
      description: "O PIX ja foi criado. Assim que o webhook confirmar o pagamento, o acesso e liberado.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Cadastro iniciado",
    description: "O login foi validado. Falta gerar e pagar o checkout PIX para ativar a conta.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  };
}
