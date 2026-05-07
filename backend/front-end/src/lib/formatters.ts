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
