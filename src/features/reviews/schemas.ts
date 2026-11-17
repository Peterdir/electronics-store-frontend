import { z } from "zod";

export const reviewImageAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const reviewImageSchema = z.file()
  .min(1, "Ảnh đã chọn bị rỗng.")
  .max(5 * 1024 * 1024, "Ảnh phải có dung lượng tối đa 5 MiB.")
  .refine((file) => {
    const dot = file.name.lastIndexOf(".");
    const extension = dot < 0 ? "" : file.name.slice(dot + 1).toLowerCase();
    return mimeByExtension[extension] === file.type.toLowerCase();
  }, "Hãy chọn ảnh JPG, JPEG, PNG hoặc WebP.");

export const reviewSchema = z.object({
  rating: z.number().int()
    .min(1, "Hãy chọn từ 1 đến 5 sao.")
    .max(5, "Hãy chọn từ 1 đến 5 sao."),
  reviewText: z.string().trim(),
  image: reviewImageSchema.nullable(),
  removeImage: z.boolean(),
}).refine((values) => !(values.image && values.removeImage), {
  path: ["image"],
  message: "Hãy chọn thay ảnh hoặc bỏ ảnh hiện tại.",
});

export type ReviewValues = z.infer<typeof reviewSchema>;
