import { z } from "zod";
import { imageUploadSchema } from "@/shared/validation/imageUpload";

export const reviewSchema = z.object({
  rating: z.number().int()
    .min(1, "Hãy chọn từ 1 đến 5 sao.")
    .max(5, "Hãy chọn từ 1 đến 5 sao."),
  reviewText: z.string().trim(),
  image: imageUploadSchema.nullable(),
  removeImage: z.boolean(),
}).refine((values) => !(values.image && values.removeImage), {
  path: ["image"],
  message: "Hãy chọn thay ảnh hoặc bỏ ảnh hiện tại.",
});

export type ReviewValues = z.infer<typeof reviewSchema>;
