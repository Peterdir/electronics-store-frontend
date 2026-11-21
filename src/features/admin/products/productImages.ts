import { z } from "zod";
import { imageUploadSchema } from "@/shared/validation/imageUpload";

export const productImagesSchema = z.array(imageUploadSchema)
  .min(1, "Chọn ít nhất một ảnh.")
  .refine((files) => files.reduce((total, file) => total + file.size, 0) < 29 * 1024 * 1024,
    "Tổng ảnh phải dưới 29 MiB để chừa dung lượng cho multipart (giới hạn request server 30 MB).");

export type ProductImageAction =
  | { kind: "upload"; files: File[] }
  | { kind: "delete"; imageId: string }
  | { kind: "primary"; imageId: string };

export function buildProductImagesFormData(files: File[]): FormData {
  const data = new FormData();
  for (const file of productImagesSchema.parse(files)) data.append("images", file);
  return data;
}
