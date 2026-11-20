import { z } from "zod";
import { imageUploadSchema } from "@/shared/validation/imageUpload";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Hãy nhập tên danh mục."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  image: imageUploadSchema.optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
