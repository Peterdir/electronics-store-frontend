import { ReturnStatus } from "@/shared/types/enums";
import type { ReturnFilters } from "./types";

export const RETURN_PAGE_SIZES = [10, 20, 50] as const;

export function parseReturnFilters(search: URLSearchParams): ReturnFilters {
  const rawPage = search.get("page") ?? "1";
  const page = /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    status: Object.values(ReturnStatus).find((value) => value === search.get("status")) ?? "PENDING",
    page: Number.isSafeInteger(page) && page <= 2_147_483_647 ? page : 1,
    size: RETURN_PAGE_SIZES.find((value) => String(value) === search.get("size")) ?? 10,
  };
}

export function serializeReturnFilters(filters: ReturnFilters): URLSearchParams {
  return new URLSearchParams({ status: filters.status, page: String(filters.page), size: String(filters.size) });
}
