import type { ViagemPessoaRanking } from "@/api/types";

function normalizeTravelerName(value?: string | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isOpaqueTravelerName(value?: string | null): boolean {
  const normalized = normalizeTravelerName(value);
  if (!normalized) {
    return true;
  }

  return (
    normalized.startsWith("sem inform") ||
    normalized.startsWith("informacoes protegidas por sigilo") ||
    normalized.startsWith("nao informado") ||
    normalized.includes("sigilo")
  );
}

export function filterVisibleTravelerRankings<T extends Pick<ViagemPessoaRanking, "nomeViajante">>(
  nodes: T[]
): T[] {
  return nodes.filter((node) => !isOpaqueTravelerName(node.nomeViajante));
}
