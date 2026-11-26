import type { AdminCoupon, CouponStatus } from "./types";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  disabled: "Đã tắt",
  scheduled: "Chưa tới hạn",
  expired: "Hết hạn",
  exhausted: "Hết lượt",
  running: "Đang chạy",
};

export function getCouponStatus(coupon: AdminCoupon, now = Date.now()): CouponStatus {
  if (!coupon.active) return "disabled";
  if (now < Date.parse(coupon.startDate)) return "scheduled";
  if (now > Date.parse(coupon.endDate)) return "expired";
  if (coupon.usedCount >= coupon.usageLimit) return "exhausted";
  return "running";
}
