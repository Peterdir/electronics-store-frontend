import { createProductSchema, type ProductFormValues } from "./schemas";
import type { CreateAdminProductRequest } from "./types";

export function buildCreateProductRequest(values: ProductFormValues): CreateAdminProductRequest {
  const parsed = createProductSchema.parse(values);
  return {
    name: parsed.name,
    categoryId: parsed.categoryId,
    brandId: parsed.brandId || null,
    basePrice: Number(parsed.basePrice),
    description: parsed.description,
    specification: Object.fromEntries(parsed.specification.map(({ key, value }) => [key, value])),
    variants: parsed.variants.map((variant) => ({
      sku: variant.sku,
      price: Number(variant.price),
      stock: Number(variant.stock),
      attributes: Object.fromEntries(variant.attributes.map(({ key, value }) => [key, value])),
    })),
  };
}

export function buildCreateProductFormData(values: ProductFormValues): FormData {
  const data = new FormData();
  data.append("data", JSON.stringify(buildCreateProductRequest(values)));
  for (const file of values.images) data.append("images", file);
  return data;
}
