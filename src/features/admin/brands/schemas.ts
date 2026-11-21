import { z } from "zod";
import { imageUploadSchema } from "@/shared/validation/imageUpload";

export const updateBrandSchema = z.object({
  name: z.string().trim().min(1, "Hãy nhập tên thương hiệu."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  logo: imageUploadSchema.optional(),
});

export const createBrandSchema = updateBrandSchema.extend({
  logo: z.file({ error: "Hãy chọn logo thương hiệu." }).pipe(imageUploadSchema),
});

export function getBrandFormSchema(isEditing: boolean) {
  return updateBrandSchema.superRefine((values, context) => {
    if (!isEditing && !values.logo) {
      context.addIssue({ code: "custom", path: ["logo"], message: "Hãy chọn logo thương hiệu." });
    }
  });
}

export type CreateBrandValues = z.infer<typeof createBrandSchema>;
export type BrandFormValues = z.infer<typeof updateBrandSchema>;
