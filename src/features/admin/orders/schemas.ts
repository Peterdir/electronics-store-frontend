import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  newStatus: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]),
}).strict();

export type UpdateOrderStatusValues = z.infer<typeof updateOrderStatusSchema>;

export const cancelAdminOrderSchema = z.object({
  reason: z.string().trim().min(1, "Vui lòng nhập lý do hủy đơn."),
}).strict();

export type CancelAdminOrderValues = z.infer<typeof cancelAdminOrderSchema>;
