import { OrderStatus, PaymentStatus } from "@/shared/types/enums";
import type { AdminOrdersFilters, GetAdminOrdersParams } from "./types";

export const ADMIN_ORDER_PAGE_SIZES = [10, 20, 50] as const;

function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 2_147_483_647 ? page : 1;
}

export function parseAdminOrdersFilters(search: URLSearchParams): AdminOrdersFilters {
  const rawSize = search.get("size");
  return {
    keyword: search.get("keyword") ?? "",
    orderStatus: Object.values(OrderStatus).find((value) => value === search.get("orderStatus")),
    paymentStatus: Object.values(PaymentStatus).find((value) => value === search.get("paymentStatus")),
    page: parsePage(search.get("page")),
    size: ADMIN_ORDER_PAGE_SIZES.find((value) => String(value) === rawSize) ?? 10,
    sortBy: search.get("sortBy") === "totalPrice" ? "totalPrice" : "createdAt",
    direction: search.get("direction") === "asc" ? "asc" : "desc",
  };
}

export function serializeAdminOrdersFilters(filters: AdminOrdersFilters): URLSearchParams {
  const search = new URLSearchParams();
  if (filters.keyword) search.set("keyword", filters.keyword);
  if (filters.orderStatus) search.set("orderStatus", filters.orderStatus);
  if (filters.paymentStatus) search.set("paymentStatus", filters.paymentStatus);
  search.set("page", String(filters.page));
  search.set("size", String(filters.size));
  search.set("sortBy", filters.sortBy);
  search.set("direction", filters.direction);
  return search;
}

export function toAdminOrdersParams(filters: AdminOrdersFilters): GetAdminOrdersParams {
  return { ...filters, keyword: filters.keyword.trim(), page: filters.page - 1 };
}
