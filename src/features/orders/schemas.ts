import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z.string()
    .trim()
    .min(1, "Vui lòng nhập lý do hủy đơn.")
    .max(200, "Lý do hủy đơn tối đa 200 ký tự."),
});

export type CancelOrderValues = z.infer<typeof cancelOrderSchema>;