import { getCouponStatus } from "./status";
import type { AdminCoupon, CouponStatus } from "./types";

export const COUPON_PAGE_SIZES = [10, 20, 50] as const;
const statuses: CouponStatus[] = ["disabled", "scheduled", "expired", "exhausted", "running"];

export function parseCouponFilters(search: URLSearchParams) {
  const rawPage = search.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Math.max(1, Number(rawPage)) : 1;
  const size = Number(search.get("size") ?? 10);
  const status = search.get("status") as CouponStatus;
  return {
    keyword: (search.get("keyword") ?? "").trim(),
    status: statuses.includes(status) ? status : "" as const,
    page,
    size: COUPON_PAGE_SIZES.includes(size as 10 | 20 | 50) ? size : 10,
  };
}

export type CouponFilters = ReturnType<typeof parseCouponFilters>;

export function serializeCouponFilters(filters: CouponFilters) {
  const search = new URLSearchParams();
  if (filters.keyword) search.set("keyword", filters.keyword);
  if (filters.status) search.set("status", filters.status);
  if (filters.page > 1) search.set("page", String(filters.page));
  if (filters.size !== 10) search.set("size", String(filters.size));
  return search;
}

export function selectCouponPage(coupons: readonly AdminCoupon[], filters: CouponFilters, now: number) {
  const rows = coupons.filter((coupon) =>
    coupon.code.toLocaleLowerCase("vi").includes(filters.keyword.toLocaleLowerCase("vi")) &&
    (!filters.status || getCouponStatus(coupon, now) === filters.status),
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / filters.size));
  const page = Math.min(filters.page, totalPages);
  return { rows: rows.slice((page - 1) * filters.size, page * filters.size), totalPages, page, totalItems: rows.length };
}
