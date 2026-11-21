import { z } from "zod";
import { createProductSchema } from "./schemas";
import type { AdminProductDetailResponse, UpdateAdminProductRequest } from "./types";

const specificationRowSchema = z.object({
  key: z.string().trim().min(1, "Nhập tên thông số."),
  value: z.string(),
  format: z.enum(["text", "json"]),
}).superRefine((row, context) => {
  if (row.format !== "json") return;
  try {
    JSON.parse(row.value);
  } catch {
    context.addIssue({ code: "custom", path: ["value"], message: "Giá trị JSON không hợp lệ." });
  }
});

export const editProductSchema = createProductSchema.pick({
  name: true, categoryId: true, brandId: true, basePrice: true, description: true,
}).extend({
  specification: z.array(specificationRowSchema).superRefine((rows, context) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      if (seen.has(row.key)) context.addIssue({ code: "custom", path: [index, "key"], message: "Tên thông số bị trùng." });
      seen.add(row.key);
    });
  }),
});

export type EditProductFormValues = z.infer<typeof editProductSchema>;

export function toEditProductValues(product: AdminProductDetailResponse): EditProductFormValues {
  return {
    name: product.name,
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? "",
    basePrice: String(product.basePrice),
    description: product.description ?? "",
    specification: Object.entries(product.specification ?? {}).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
      format: typeof value === "string" ? "text" : "json",
    })),
  };
}

export function buildUpdateProductRequest(values: EditProductFormValues): UpdateAdminProductRequest {
  const parsed = editProductSchema.parse(values);
  return {
    name: parsed.name,
    categoryId: parsed.categoryId,
    brandId: parsed.brandId || null,
    basePrice: Number(parsed.basePrice),
    description: parsed.description,
    specification: Object.fromEntries(parsed.specification.map(({ key, value, format }) => [
      key, format === "json" ? JSON.parse(value) : value,
    ])),
  };
}
