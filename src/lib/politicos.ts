import type { PoliticoResumo } from "@/api/types";

type PoliticoRouteTarget =
  | string
  | null
  | undefined
  | Pick<PoliticoResumo, "nomeCompleto" | "nomeCanonico" | "id">
  | {
      nome?: string;
      nomeCompleto?: string;
      nomeCanonico?: string;
      id?: string;
    };

export function buildPoliticoPath(target: PoliticoRouteTarget): string {
  const lookup = getPoliticoLookupValue(target);
  return `/politico/${encodeURIComponent(toPoliticoRouteSegment(lookup))}`;
}

export function getPoliticoLookupValue(target: PoliticoRouteTarget): string {
  if (!target) {
    return "";
  }

  if (typeof target === "string") {
    return normalizePoliticoLookup(target);
  }

  const rawValue =
    target.nomeCompleto?.trim() ||
    target.nome?.trim() ||
    normalizeCanonico(target.nomeCanonico) ||
    target.id?.trim() ||
    "";

  return normalizePoliticoLookup(rawValue);
}

function normalizeCanonico(value?: string): string {
  return (value || "").replace(/-/g, " ").trim();
}

function normalizePoliticoLookup(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPoliticoRouteSegment(value: string): string {
  return normalizePoliticoLookup(value).replace(/\s+/g, "-");
}
