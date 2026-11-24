import { inventoryStatuses, type InventoryParams, type InventoryResponse, type InventoryStatus } from "./types";

export const INVENTORY_PAGE_SIZES = [10, 20, 50] as const;
export const inventorySortFields = ["productName", "sku", "quantity", "updatedAt"] as const;
export type InventorySort = typeof inventorySortFields[number];
export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  IN_STOCK: "Còn hàng", LOW_STOCK: "Sắp hết hàng", OUT_OF_STOCK: "Hết hàng",
};

export function parseInventoryFilters(params: URLSearchParams) {
  const rawPage = params.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    keyword: params.get("keyword") ?? "",
    status: inventoryStatuses.find((value) => value === params.get("status")) ?? "" as const,
    minQuantity: params.get("minQuantity") ?? "",
    maxQuantity: params.get("maxQuantity") ?? "",
    sortBy: inventorySortFields.find((value) => value === params.get("sortBy")) ?? "quantity",
    direction: params.get("direction") === "desc" ? "desc" as const : "asc" as const,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: INVENTORY_PAGE_SIZES.find((value) => String(value) === params.get("size")) ?? 10,
  };
}
export type InventoryFilters = ReturnType<typeof parseInventoryFilters>;

export function serializeInventoryFilters(filters: InventoryFilters) {
  const params = new URLSearchParams();
  for (const key of ["keyword", "status", "minQuantity", "maxQuantity"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (filters.sortBy !== "quantity") params.set("sortBy", filters.sortBy);
  if (filters.direction !== "asc") params.set("direction", filters.direction);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.size !== 10) params.set("size", String(filters.size));
  return params;
}

export function validateInventoryFilters(filters: InventoryFilters): string | null {
  for (const value of [filters.minQuantity, filters.maxQuantity]) {
    if (value !== "" && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      return "Khoảng tồn phải là số nguyên không âm trong giới hạn số an toàn của JavaScript.";
    }
  }
  if (filters.minQuantity !== "" && filters.maxQuantity !== "" && Number(filters.minQuantity) > Number(filters.maxQuantity)) {
    return "Tồn tối thiểu không được lớn hơn tồn tối đa.";
  }
  return null;
}

export function toInventoryParams(filters: InventoryFilters): InventoryParams {
  return {
    status: filters.status || undefined,
    minQuantity: filters.minQuantity === "" ? undefined : Number(filters.minQuantity),
    maxQuantity: filters.maxQuantity === "" ? undefined : Number(filters.maxQuantity),
  };
}

export function selectInventoryPage(items: readonly InventoryResponse[], filters: InventoryFilters) {
  const keyword = filters.keyword.trim().toLocaleLowerCase("vi");
  const sorted = items.filter((item) => !keyword || [item.sku, item.productName].some(
    (value) => value?.toLocaleLowerCase("vi").includes(keyword),
  )).sort((a, b) => {
    const left = a[filters.sortBy];
    const right = b[filters.sortBy];
    if (left == null && right != null) return 1;
    if (right == null && left != null) return -1;
    const compared = typeof left === "number" && typeof right === "number"
      ? left - right : String(left ?? "").localeCompare(String(right ?? ""), "vi");
    return (filters.direction === "asc" ? compared : -compared) || a.id.localeCompare(b.id);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / filters.size));
  const page = Math.min(filters.page, totalPages);
  return { rows: sorted.slice((page - 1) * filters.size, page * filters.size), page, totalPages, totalItems: sorted.length };
}
