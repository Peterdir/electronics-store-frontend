import { z } from "zod";
import { createProductSchema } from "./schemas";
import type { AdminProductDetailResponse, UpdateAdminProductRequest } from "./types";

const specificationRowSchema = z.object({
  key: z.string().trim().min(1, "Nhập tên thông số."),
  value: z.string(),
  // Internal snapshot for legacy non-string values, never an editable field.
  original: z.object({ key: z.string(), value: z.string().refine((value) => {
    try { JSON.parse(value); return true; } catch { return false; }
  }) }).optional(),
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
      ...(typeof value === "string" ? {} : { original: { key, value: JSON.stringify(value) } }),
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
    specification: Object.fromEntries(parsed.specification.map(({ key, value, original }) => [
      key, original && key === original.key && value === original.value ? JSON.parse(original.value) : value,
    ])),
  };
}
