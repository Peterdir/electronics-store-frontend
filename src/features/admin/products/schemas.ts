import { z } from "zod";
import { isPositiveLongId } from "@/shared/types/common";
import { imageUploadSchema } from "@/shared/validation/imageUpload";

const moneyField = z.string().trim().refine(
  (value) => /^\d+(\.\d+)?$/.test(value) && Number.isFinite(Number(value)) && Number(value) <= Number.MAX_SAFE_INTEGER,
  "Nhập số tiền không âm, trong giới hạn số an toàn.",
);
const stockField = z.string().trim().refine(
  (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)),
  "Tồn kho phải là số nguyên không âm, trong giới hạn số an toàn.",
);

const keyValueSchema = z.object({
  key: z.string().trim().min(1, "Nhập tên thông số/thuộc tính."),
  value: z.string().trim().min(1, "Nhập giá trị."),
});

const keyValueRowsSchema = z.array(keyValueSchema).superRefine((rows, context) => {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (seen.has(row.key)) {
      context.addIssue({ code: "custom", path: [index, "key"], message: "Tên bị trùng; mỗi key chỉ có một giá trị." });
    }
    seen.add(row.key);
  });
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên sản phẩm."),
  categoryId: z.string().refine(isPositiveLongId, "Chọn danh mục hợp lệ."),
  brandId: z.string().refine((value) => value === "" || isPositiveLongId(value), "Chọn thương hiệu hợp lệ."),
  basePrice: moneyField,
  description: z.string().trim(),
  specification: keyValueRowsSchema,
  variants: z.array(z.object({
    sku: z.string().trim().min(1, "Nhập SKU."),
    price: moneyField,
    stock: stockField,
    attributes: keyValueRowsSchema,
  })).min(1, "Cần ít nhất một biến thể.").superRefine((variants, context) => {
    const seen = new Set<string>();
    variants.forEach((variant, index) => {
      const sku = variant.sku.toLowerCase();
      if (seen.has(sku)) {
        context.addIssue({ code: "custom", path: [index, "sku"], message: "SKU trùng trong form (không phân biệt hoa/thường)." });
      }
      seen.add(sku);
    });
  }),
  images: z.array(imageUploadSchema),
});

export type ProductFormValues = z.infer<typeof createProductSchema>;

export function newProductVariant(): ProductFormValues["variants"][number] {
  return { sku: "", price: "", stock: "0", attributes: [] };
}

export function newProductFormValues(): ProductFormValues {
  return {
    name: "", categoryId: "", brandId: "", basePrice: "", description: "",
    specification: [], variants: [newProductVariant()], images: [],
  };
}
