import type { DiscountType } from "@/shared/types/enums";

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
}

export type CouponStatus = "disabled" | "scheduled" | "expired" | "exhausted" | "running";
