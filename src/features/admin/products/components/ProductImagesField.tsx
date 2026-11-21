import { useEffect, useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { imageUploadAccept, imageUploadSchema } from "@/shared/validation/imageUpload";
import type { ProductFormValues } from "../schemas";

function ImagePreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={`Xem trước ${file.name}`} className="size-24 rounded-lg bg-muted object-contain" />;
}

export function ProductImagesField({ disabled }: { disabled: boolean }) {
  const id = useId();
  const { control, getFieldState, formState } = useFormContext<ProductFormValues>();
  return (
    <Controller name="images" control={control} render={({ field, fieldState }) => (
      <div className="space-y-3">
        <label htmlFor={id} className="block text-lg font-semibold">Ảnh sản phẩm (tùy chọn)</label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">Có thể chọn nhiều ảnh JPG, JPEG, PNG, WebP; tối đa 5 MiB/ảnh. Ảnh đầu tiên là ảnh đại diện khi tạo.</p>
        <input id={id} ref={field.ref} onBlur={field.onBlur} type="file" multiple accept={imageUploadAccept} disabled={disabled} aria-invalid={Boolean(fieldState.error)}
          className="block w-full rounded-lg border border-input p-3 text-sm" aria-describedby={`${id}-help`}
          onChange={(event) => {
            field.onChange([...field.value, ...Array.from(event.currentTarget.files ?? [])]);
            event.currentTarget.value = "";
          }} />
        <ul className="space-y-3">
          {field.value.map((file, index) => {
            const error = getFieldState(`images.${index}`, formState).error;
            return (
              <li key={index} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                {imageUploadSchema.safeParse(file).success && <ImagePreview file={file} />}
                <div className="min-w-0 flex-1 wrap-anywhere">
                  <p className="text-sm">{index + 1}. {file.name}{index === 0 ? " (ảnh đại diện)" : ""}</p>
                  {error?.message && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
                </div>
                <Button type="button" variant="outline" disabled={disabled} aria-label={`Bỏ ảnh ${index + 1}: ${file.name}`}
                  onClick={() => field.onChange(field.value.filter((_, position) => position !== index))}>Bỏ ảnh</Button>
              </li>
            );
          })}
        </ul>
      </div>
    )} />
  );
}
