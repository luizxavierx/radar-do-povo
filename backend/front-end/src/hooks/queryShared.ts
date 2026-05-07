import { keepPreviousData } from "@tanstack/react-query";
import type { PaginationInput } from "@/api/types";

const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;
const DEFAULT_PAGE_SIZE = 20;

export const QUERY_STALE_TIME = 60_000;
export const QUERY_GC_TIME = 30 * 60_000;

export const paginatedQueryDefaults = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
  placeholderData: keepPreviousData,
} as const;

export function normalizePagination(
  pagination?: PaginationInput,
  fallbackLimit = DEFAULT_PAGE_SIZE
): Required<PaginationInput> {
  const rawLimit = pagination?.limit ?? fallbackLimit;
  const rawOffset = pagination?.offset ?? 0;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));
  const offset = Math.max(0, rawOffset);
  return { limit, offset };
}
