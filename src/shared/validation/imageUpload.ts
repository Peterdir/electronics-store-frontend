import { z } from "zod";

export const imageUploadAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const imageUploadSchema = z.file()
  .min(1, "Ảnh đã chọn bị rỗng.")
  .max(5 * 1024 * 1024, "Ảnh phải có dung lượng tối đa 5 MiB.")
  .refine((file) => {
    const dot = file.name.lastIndexOf(".");
    const extension = dot < 0 ? "" : file.name.slice(dot + 1).toLowerCase();
    return mimeByExtension[extension] === file.type.toLowerCase();
  }, "Hãy chọn ảnh JPG, JPEG, PNG hoặc WebP.");
