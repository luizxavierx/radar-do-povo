/**
 * Formats cents (string) as BRL currency.
 * Uses string to keep precision before conversion.
 */
export function formatCents(cents?: string | null): string {
  if (!cents) return "R$ 0,00";

  try {
    const cleaned = String(cents).replace(/\D/g, "");
    if (!cleaned) return "R$ 0,00";

    const len = cleaned.length;
    const reais = len > 2 ? cleaned.slice(0, len - 2) : "0";
    const centavos = cleaned.slice(-2).padStart(2, "0");
    const formatted = Number(reais).toLocaleString("pt-BR");

    return `R$ ${formatted},${centavos}`;
  } catch {
    return `R$ ${cents}`;
  }
}

function compactNumberFormatter(mode: "short" | "long") {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: mode,
    maximumFractionDigits: 1,
  });
}

function compactCurrencyFormatter(mode: "short" | "long") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    compactDisplay: mode,
    maximumFractionDigits: 1,
  });
}

interface CompactMagnitude {
  threshold: number;
  divisor: number;
  singular: string;
  plural: string;
  short: string;
}

const COMPACT_MAGNITUDES: CompactMagnitude[] = [
  {
    threshold: 1_000_000_000_000,
    divisor: 1_000_000_000_000,
    singular: "trilhao",
    plural: "trilhoes",
    short: "tri",
  },
  {
    threshold: 1_000_000_000,
    divisor: 1_000_000_000,
    singular: "bilhao",
    plural: "bilhoes",
    short: "bi",
  },
  {
    threshold: 1_000_000,
    divisor: 1_000_000,
    singular: "milhao",
    plural: "milhoes",
    short: "mi",
  },
  {
    threshold: 1_000,
    divisor: 1_000,
    singular: "mil",
    plural: "mil",
    short: "mil",
  },
];

function pickCompactMagnitude(value: number) {
  const absoluteValue = Math.abs(value);
  return COMPACT_MAGNITUDES.find((magnitude) => absoluteValue >= magnitude.threshold);
}

function formatScaledCompactValue(value: number) {
  const absoluteValue = Math.abs(value);
  const maximumFractionDigits = absoluteValue >= 100 ? 0 : 1;

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatCompactWords(value: number, mode: "short" | "long") {
  const magnitude = pickCompactMagnitude(value);
  if (!magnitude) {
    return value.toLocaleString("pt-BR");
  }

  const scaled = value / magnitude.divisor;
  const label =
    mode === "short"
      ? magnitude.short
      : magnitude.singular === magnitude.plural || Math.abs(scaled) < 2
        ? magnitude.singular
        : magnitude.plural;

  return `${formatScaledCompactValue(scaled)} ${label}`.trim();
}

export function formatCountCompact(
  value?: number | null,
  mode: "short" | "long" = "long"
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "0";
  }

  if (Math.abs(value) < 1000) {
    return value.toLocaleString("pt-BR");
  }

  try {
    return formatCompactWords(value, mode);
  } catch {
    return compactNumberFormatter(mode).format(value);
  }
}

export function formatCentsCompact(
  cents?: string | null,
  mode: "short" | "long" = "long"
): string {
  if (!cents) {
    return "R$ 0,00";
  }

  const value = centsToNumber(cents);
  if (!Number.isFinite(value)) {
    return formatCents(cents);
  }

  if (Math.abs(value) < 1000) {
    return formatCents(cents);
  }

  try {
    return `R$ ${formatCompactWords(value, mode)}`;
  } catch {
    return compactCurrencyFormatter(mode).format(value);
  }
}

/** Converts cents to a JS number in BRL units (for charts/averages). */
export function centsToNumber(cents?: string | null): number {
  if (!cents) return 0;
  const cleaned = String(cents).replace(/\D/g, "");
  if (!cleaned) return 0;
  return Number(cleaned) / 100;
}

/** Safe BigInt parser used for totals without precision loss. */
export function toBigInt(cents?: string | null): bigint {
  if (!cents) return 0n;
  const cleaned = String(cents).replace(/\D/g, "");
  if (!cleaned) return 0n;

  try {
    return BigInt(cleaned);
  } catch {
    return 0n;
  }
}

/** Formats ISO date into dd/mm/yyyy. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "-";

  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
