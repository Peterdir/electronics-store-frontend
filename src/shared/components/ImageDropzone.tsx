import { useEffect, useRef, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { imageUploadAccept, imageUploadSchema } from "@/shared/validation/imageUpload";

function FilePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={imageRef} alt="Ảnh mới đã chọn" className="size-28 rounded-lg bg-muted object-contain" />;
}

interface ImageDropzoneProps extends Pick<ComponentProps<"input">, "ref" | "onBlur"> {
  id: string;
  file?: File;
  existingImageUrl?: string | null;
  label?: string;
  onChange: (file: File | undefined) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function ImageDropzone({
  id, file, existingImageUrl, label = "Ảnh", onChange, error, disabled, required = false, ref, onBlur,
}: ImageDropzoneProps) {
  function selectFiles(files: File[]) {
    if (disabled || files.length === 0) return;
    onChange(files[0]);
  }

  const canPreview = file && imageUploadSchema.safeParse(file).success;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label} {required ? "* (bắt buộc)" : "(tùy chọn)"}</label>
      <p id={`${id}-help`} className="text-sm text-muted-foreground">
        Chọn hoặc kéo thả một ảnh JPG, JPEG, PNG, WebP; tối đa 5 MiB.
        {existingImageUrl && " Không chọn ảnh mới sẽ giữ ảnh hiện tại."}
      </p>
      <div
        className="space-y-3 rounded-xl border border-dashed border-input bg-muted/20 p-4"
        onDragOver={(event) => { event.preventDefault(); }}
        onDrop={(event) => {
          event.preventDefault();
          selectFiles(Array.from(event.dataTransfer.files));
        }}
      >
        {canPreview ? <FilePreview file={file} /> : existingImageUrl ? (
          <img src={existingImageUrl} alt="Ảnh hiện tại" className="size-28 rounded-lg bg-muted object-contain" />
        ) : <p className="text-sm text-muted-foreground">Chưa có ảnh.</p>}
        <input
          ref={ref}
          id={id}
          type="file"
          accept={imageUploadAccept}
          disabled={disabled}
          aria-required={required}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          className="block w-full min-w-0 rounded-lg border border-input bg-background p-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          onChange={(event) => {
            selectFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        {file && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 text-sm wrap-anywhere">{file.name}</span>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => onChange(undefined)}>
              Bỏ ảnh mới
            </Button>
          </div>
        )}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
