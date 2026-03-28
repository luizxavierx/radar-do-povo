export type MemberStatus = "pending_checkout" | "awaiting_payment" | "active";

export type MemberPortalUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
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

export type MemberPortalJourneyAction = {
  label: string;
  href: string;
  kind: "checkout" | "payment" | "api_key" | "docs";
};

export type MemberPortalJourneyStep = {
  key: "identity" | "checkout" | "payment" | "api_key";
  label: string;
  description: string;
  complete: boolean;
  current: boolean;
};

export type MemberPortalJourney = {
  currentStep: "checkout" | "payment" | "api_key" | "ready";
  title: string;
  description: string;
  primaryAction: MemberPortalJourneyAction;
  steps: MemberPortalJourneyStep[];
};

export type MemberPortalApiKey = {
  exists: boolean;
  prefix?: string | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
};

export type MemberPixCharge = {
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  expiresInSeconds?: number | null;
  isExpired?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MemberPortalAccount = {
  user: MemberPortalUser;
  membership: MemberPortalMembership;
  usage: MemberPortalUsage;
  journey: MemberPortalJourney;
  apiKey: MemberPortalApiKey;
  latestCharge: MemberPixCharge | null;
};

export type MemberPortalRotateKeyResponse = {
  issuedKey: {
    prefix: string;
    plainTextKey: string;
    generatedAt: string;
  };
  account: MemberPortalAccount;
};

export const MEMBER_API_BASE_URL =
  import.meta.env.VITE_MEMBER_API_BASE_URL?.trim() || "https://abertos.radardopovo.com/v1";

export const MEMBER_PORTAL_BASE_URL =
  import.meta.env.VITE_MEMBER_PORTAL_BASE_URL?.trim() ||
  "https://api.radardopovo.com/api/member/portal";

export const MEMBER_PORTAL_DEMO =
  (import.meta.env.VITE_MEMBER_PORTAL_DEMO ?? "false").toLowerCase() === "true";

export const MEMBER_PIX_EXPIRATION_MINUTES = 15;

export const MEMBER_PLAN = {
  slug: "membros-radar-mensal",
  name: "Radar do Povo Membros",
  description:
    "Assinatura mensal para acessar a API de membros com checkout PIX, painel de conta e chave individual por operacao.",
  priceCents: 1500,
  priceLabel: "R$ 15/mensal",
  monthlyRequestLimit: 5000,
  perSecondLimit: 1,
} as const;

export const DEFAULT_MEMBER_PLAN = MEMBER_PLAN;

export const PUSHINPAY_NOTICE =
  "A PUSHIN PAY atua exclusivamente como processadora de pagamentos e nao possui qualquer responsabilidade pela entrega, suporte, conteudo, qualidade ou cumprimento das obrigacoes relacionadas aos produtos ou servicos oferecidos pelo vendedor.";

export function getMemberStatusMeta(status: MemberStatus) {
  if (status === "active") {
    return {
      label: "Acesso ativo",
      description: "Assinatura confirmada, acesso liberado e chave pronta para uso nas integracoes.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "awaiting_payment") {
    return {
      label: "Aguardando pagamento",
      description:
        "O checkout ja foi emitido. O portal acompanha a cobranca e libera a conta logo apos a confirmacao.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Cadastro iniciado",
    description: "Sua conta ja existe. Falta emitir o PIX e concluir a ativacao do plano.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

export function getMemberChargeStatusMeta(status?: MemberPixCharge["status"] | null) {
  if (status === "paid") {
    return {
      label: "Pagamento confirmado",
      description: "Cobranca concluida com sucesso e pronta para refletir no acesso do membro.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "created") {
    return {
      label: "PIX aguardando pagamento",
      description:
        "O QR Code esta pronto. Assim que o pagamento for confirmado, o acesso avanca automaticamente.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "expired") {
    return {
      label: "PIX expirado",
      description: "Essa cobranca expirou. Gere um novo PIX para continuar a ativacao ou renovacao.",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (status === "canceled") {
    return {
      label: "PIX cancelado",
      description: "A cobranca foi cancelada. Gere um novo checkout para retomar o processo.",
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Checkout nao iniciado",
    description: "Ainda nao existe uma cobranca em aberto para esta conta.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

export function formatMemberDateTime(value?: string | null) {
  if (!value) {
    return "Sem registro";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPixCountdown(totalSeconds?: number | null) {
  if (!totalSeconds || totalSeconds <= 0) {
    return "Expirado";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
