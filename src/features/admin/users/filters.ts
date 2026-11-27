import type { UserFilters } from "./types";

export const USER_PAGE_SIZES = [10, 20, 50] as const;

export function parseUserFilters(search: URLSearchParams): UserFilters {
  const rawPage = search.get("page") ?? "1";
  const page = /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;

  return {
    keyword: (search.get("keyword") ?? "").trim(),
    page: Number.isSafeInteger(page) && page <= 2_147_483_647 ? page : 1,
    size: USER_PAGE_SIZES.find((size) => String(size) === search.get("size")) ?? 10,
  };
}

export function serializeUserFilters(filters: UserFilters): URLSearchParams {
  const search = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });
  if (filters.keyword) search.set("keyword", filters.keyword);
  return search;
}
