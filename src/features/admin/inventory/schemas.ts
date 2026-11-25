import { z } from "zod";

export const adjustStockSchema = z.object({
  action: z.enum(["ADD", "DEDUCT"]),
  quantity: z.string().trim().regex(/^[0-9]+$/, "Nhập số nguyên dương, không dùng số mũ hoặc số thập phân.")
    .transform(Number).refine((value) => Number.isSafeInteger(value) && value > 0, "Số lượng phải là số nguyên dương trong giới hạn an toàn."),
  reason: z.string().trim().transform((value) => value || undefined),
});

export function previewStock(stock: number | null, action: "ADD" | "DEDUCT", quantity: number): number | null {
  if (stock === null || !Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(quantity) || quantity <= 0) return null;
  const result = action === "ADD" ? stock + quantity : stock - quantity;
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}
