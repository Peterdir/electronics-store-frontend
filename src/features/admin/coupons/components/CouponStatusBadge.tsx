import { COUPON_STATUS_LABELS, getCouponStatus } from "../status";
import type { AdminCoupon } from "../types";

export function CouponStatusBadge({ coupon, now }: { coupon: AdminCoupon; now: number }) {
  const status = getCouponStatus(coupon, now);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
      status === "running" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-border bg-muted text-muted-foreground"
    }`}>
      {COUPON_STATUS_LABELS[status]}
    </span>
  );
}
