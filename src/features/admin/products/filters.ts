import { isPositiveLongId } from "@/shared/types/common";
import { ProductStatus } from "@/shared/types/enums";
import type { AdminProductsFilters, AdminProductSortBy, GetAdminProductsParams } from "./types";

export const ADMIN_PRODUCT_PAGE_SIZES = [10, 20, 50] as const;
export const ADMIN_PRODUCT_SORT_FIELDS: readonly AdminProductSortBy[] = ["createdAt", "name", "basePrice"];
export const productStatusLabels: Record<ProductStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Ngừng bán",
  HIDDEN: "Đang ẩn",
};

function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= Math.floor(2_147_483_647 / 50) ? page : 1;
}

export function parseAdminProductsFilters(search: URLSearchParams): AdminProductsFilters {
  const categoryId = search.get("categoryId") ?? undefined;
  const brandId = search.get("brandId") ?? undefined;
  return {
    keyword: search.get("keyword") ?? "",
    status: Object.values(ProductStatus).find((value) => value === search.get("status")),
    categoryId: isPositiveLongId(categoryId) ? categoryId : undefined,
    brandId: isPositiveLongId(brandId) ? brandId : undefined,
    page: parsePage(search.get("page")),
    size: ADMIN_PRODUCT_PAGE_SIZES.find((value) => String(value) === search.get("size")) ?? 10,
    sortBy: ADMIN_PRODUCT_SORT_FIELDS.find((value) => value === search.get("sortBy")) ?? "createdAt",
    direction: search.get("direction") === "asc" ? "asc" : "desc",
  };
}

export function serializeAdminProductsFilters(filters: AdminProductsFilters): URLSearchParams {
  const search = new URLSearchParams();
  if (filters.keyword) search.set("keyword", filters.keyword);
  if (filters.status) search.set("status", filters.status);
  if (filters.categoryId) search.set("categoryId", filters.categoryId);
  if (filters.brandId) search.set("brandId", filters.brandId);
  search.set("page", String(filters.page));
  search.set("size", String(filters.size));
  search.set("sortBy", filters.sortBy);
  search.set("direction", filters.direction);
  return search;
}

export function toAdminProductsParams(filters: AdminProductsFilters): GetAdminProductsParams {
  return { ...filters, keyword: filters.keyword.trim(), page: filters.page - 1 };
}
