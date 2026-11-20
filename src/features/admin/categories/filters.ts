import type { AdminCategoryResponse } from "./types";

export const CATEGORY_PAGE_SIZES = [10, 20, 50] as const;

export function parseCategoryFilters(params: URLSearchParams) {
  const rawPage = params.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const rawStatus = params.get("status");
  const rawSize = Number(params.get("size"));
  return {
    keyword: params.get("keyword") ?? "",
    status: rawStatus === "ACTIVE" || rawStatus === "INACTIVE" ? rawStatus : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: CATEGORY_PAGE_SIZES.find((size) => size === rawSize) ?? 10,
  };
}

export type CategoryFilters = ReturnType<typeof parseCategoryFilters>;

export function serializeCategoryFilters(filters: CategoryFilters) {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.status) params.set("status", filters.status);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.size !== 10) params.set("size", String(filters.size));
  return params;
}

export function selectCategoryPage(categories: readonly AdminCategoryResponse[], filters: CategoryFilters) {
  const keyword = filters.keyword.trim().toLocaleLowerCase("vi");
  const filtered = categories.filter((category) =>
    (!filters.status || category.status === filters.status) &&
    category.name.toLocaleLowerCase("vi").includes(keyword),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / filters.size));
  const page = Math.min(filters.page, totalPages);
  return {
    rows: filtered.slice((page - 1) * filters.size, page * filters.size),
    totalItems: filtered.length,
    totalPages,
    page,
  };
}
