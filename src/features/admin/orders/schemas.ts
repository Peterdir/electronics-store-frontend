import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  newStatus: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]),
}).strict();

export type UpdateOrderStatusValues = z.infer<typeof updateOrderStatusSchema>;
