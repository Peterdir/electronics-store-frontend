import { z } from "zod";
import { DiscountType } from "@/shared/types/enums";
import { vietnamTimeToInstant } from "./time";
import type { AdminCoupon, CouponRequest } from "./types";

const numericInput = z.string().trim().min(1, "Không được bỏ trống.")
  .transform(Number).pipe(z.number().finite("Phải là số hữu hạn."));

export const couponFormSchema = z.object({
  code: z.string().trim().min(1, "Nhập mã coupon."),
  discountType: z.enum(DiscountType),
  discountValue: numericInput.pipe(z.number().positive("Giá trị giảm phải lớn hơn 0.")),
  minOrderValue: numericInput.pipe(z.number().min(0, "Giá trị đơn tối thiểu không được âm.")),
  usageLimit: numericInput.pipe(z.number().int("Số lượt phải là số nguyên.").min(1).max(2_147_483_647)),
  startDate: z.string().refine((value) => vietnamTimeToInstant(value) !== null, "Giờ bắt đầu không hợp lệ."),
  endDate: z.string().refine((value) => vietnamTimeToInstant(value) !== null, "Giờ kết thúc không hợp lệ."),
}).superRefine((values, context) => {
  if (values.discountType === DiscountType.PERCENTAGE && values.discountValue > 100) {
    context.addIssue({ code: "custom", path: ["discountValue"], message: "Phần trăm giảm không được vượt quá 100%." });
  }
  const start = vietnamTimeToInstant(values.startDate);
  const end = vietnamTimeToInstant(values.endDate);
  if (start && end && Date.parse(end) < Date.parse(start)) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "Kết thúc phải từ thời điểm bắt đầu trở đi." });
  }
});

export type CouponFormInput = z.input<typeof couponFormSchema>;

export function toCouponRequest(values: z.output<typeof couponFormSchema>): CouponRequest {
  return {
    ...values,
    startDate: vietnamTimeToInstant(values.startDate)!,
    endDate: vietnamTimeToInstant(values.endDate)!,
  };
}

export const adminCouponSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  code: z.string(),
  discountType: z.enum(DiscountType),
  discountValue: z.number().finite(),
  minOrderValue: z.number().finite(),
  usageLimit: z.number().int(),
  usedCount: z.number().int(),
  startDate: z.iso.datetime({ offset: true }),
  endDate: z.iso.datetime({ offset: true }),
  active: z.boolean(),
}) satisfies z.ZodType<AdminCoupon>;
