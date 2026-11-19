import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { imageUploadAccept, imageUploadSchema } from "@/shared/validation/imageUpload";
import { maxEvidenceImages } from "../schemas";

function EvidencePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <img ref={imageRef} alt="" className="aspect-square w-full rounded-lg bg-muted object-cover" />;
}

export function EvidenceImagesField({
  id, files, onChange, ref, onBlur, error, required,
}: Pick<ComponentProps<"input">, "ref" | "onBlur"> & {
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  required: boolean;
}) {
  const [selectionError, setSelectionError] = useState<string>();
  const message = selectionError ?? error;

  function addImages(selected: File[]) {
    if (files.length + selected.length > maxEvidenceImages) {
      setSelectionError(`Chỉ được đính kèm tối đa ${maxEvidenceImages} ảnh. Hãy bỏ bớt ảnh hoặc chọn lại.`);
      return;
    }

    for (const file of selected) {
      const result = imageUploadSchema.safeParse(file);
      if (!result.success) {
        setSelectionError(`${file.name} · ${result.error.issues[0].message}`);
        return;
      }
    }

    setSelectionError(undefined);
    onChange([...files, ...selected]);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        Ảnh bằng chứng {required ? "(bắt buộc)" : "(tùy chọn)"}
      </label>
      <p id={`${id}-help`} className="text-sm text-muted-foreground">
        {required ? "Đính kèm ít nhất một ảnh cho tình trạng lỗi hoặc hư hỏng. " : "Bạn có thể đính kèm ảnh để mô tả rõ hơn. "}
        Tối đa {maxEvidenceImages} ảnh JPG, JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB.
      </p>
      <input
        ref={ref}
        id={id}
        type="file"
        accept={imageUploadAccept}
        multiple
        aria-required={required}
        aria-invalid={Boolean(message)}
        aria-describedby={`${id}-help${message ? ` ${id}-error` : ""}`}
        onBlur={onBlur}
        onChange={(event) => {
          const input = event.currentTarget;
          const selected = Array.from(input.files ?? []);
          input.value = "";
          if (selected.length) addImages(selected);
        }}
        className="block w-full min-w-0 rounded-lg border border-input bg-background p-2 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium file:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      />
      {message && <p id={`${id}-error`} role="alert" className="text-sm text-destructive wrap-anywhere">{message}</p>}
      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="min-w-0 space-y-1 rounded-xl border border-border p-2">
              <EvidencePreview file={file} />
              <p className="truncate text-xs text-muted-foreground" title={file.name}>{file.name}</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Bỏ ảnh ${file.name}`}
                onClick={() => {
                  setSelectionError(undefined);
                  onChange(files.filter((_, position) => position !== index));
                  document.getElementById(id)?.focus();
                }}
              >
                Bỏ ảnh
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
