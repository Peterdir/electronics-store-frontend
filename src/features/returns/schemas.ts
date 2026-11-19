import { z } from "zod";
import { imageUploadSchema } from "@/shared/validation/imageUpload";
import { requiresReturnImages } from "./reasons";

export const maxEvidenceImages = 5;

export function createReturnRequestSchema(purchasedQuantity: number) {
  return z.object({
    quantity: z.number({ error: "Hãy nhập số lượng hợp lệ." })
      .int("Số lượng phải là số nguyên.")
      .min(1, "Số lượng phải từ 1 trở lên.")
      .max(purchasedQuantity, `Chỉ có thể trả tối đa ${purchasedQuantity} sản phẩm.`),
    reason: z.string().trim().min(1, "Hãy chọn lý do trả hàng."),
    description: z.string().trim(),
    images: z.array(imageUploadSchema)
      .max(maxEvidenceImages, `Chỉ được đính kèm tối đa ${maxEvidenceImages} ảnh.`),
  }).refine((values) => !requiresReturnImages(values.reason) || values.images.length > 0, {
    path: ["images"],
    message: "Hãy đính kèm ít nhất một ảnh bằng chứng cho lý do sản phẩm bị lỗi hoặc hư hỏng.",
  });
}

export type ReturnRequestValues = z.infer<ReturnType<typeof createReturnRequestSchema>>;
