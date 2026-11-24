import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { imageUploadAccept, imageUploadSchema } from "@/shared/validation/imageUpload";
import { useAdminProductImages } from "../imageQueries";
import { productImagesSchema, type ProductImageAction } from "../productImages";
import { isCurrentProductSession, isProductWriteUncertain, type ProductSession } from "../queries";
import type { AdminProductDetailResponse } from "../types";

function LocalPreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={`Xem trước ${file.name}`} className="size-24 rounded-lg object-contain" />;
}

function ServerImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return !url || failed
    ? <div className="flex h-36 items-center justify-center rounded-lg bg-muted text-sm">Không có ảnh hiển thị</div>
    : <img src={url} alt="Ảnh sản phẩm đã lưu" className="h-36 w-full rounded-lg object-contain" onError={() => setFailed(true)} />;
}

interface Props {
  product: AdminProductDetailResponse;
  session: ProductSession;
  unavailable: boolean;
  reload: () => Promise<AdminProductDetailResponse>;
}

export function ProductImageManager({ product, session, unavailable, reload }: Props) {
  const inputId = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(false);
  const running = useRef(false);
  const mutation = useAdminProductImages(product.id);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const active = () => mounted.current && isCurrentProductSession(session);
  const busy = mutation.isPending || refreshing;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const locked = busy || needsRefresh || forbidden || unavailable || !isCurrentProductSession(session);
  const validation = productImagesSchema.safeParse(files);

  async function refresh() {
    setRefreshing(true);
    try {
      await reload();
      if (!active()) return;
      setNeedsRefresh(false);
      setDeleteId(null);
      setError("");
      mutation.reset();
    } catch (cause) {
      if (active()) {
        setNeedsRefresh(true);
        setError(`Không tải lại được ảnh: ${cause instanceof Error ? cause.message : "Lỗi kết nối"}. Chỉ thử GET lại trước khi thao tác tiếp.`);
      }
    } finally {
      if (active()) setRefreshing(false);
    }
  }

  async function perform(action: ProductImageAction) {
    if (running.current || locked || !isCurrentProductSession(session)) return;
    running.current = true;
    setError("");
    setMessage("");
    try {
      await mutation.mutateAsync({ action, session: { ...session } });
      if (!active()) return;
      if (action.kind === "upload") setFiles([]);
      setDeleteId(null);
      setMessage(action.kind === "upload" ? "Đã thêm ảnh." : action.kind === "delete" ? "Đã xóa ảnh." : "Đã chọn ảnh đại diện.");
      setNeedsRefresh(true);
      await refresh();
    } catch (cause) {
      if (!active()) return;
      const uncertain = isProductWriteUncertain(cause);
      const missing = cause instanceof ApiError && cause.status === 404;
      setNeedsRefresh(uncertain || missing);
      setError(uncertain
        ? "Chưa xác nhận được kết quả. Tải lại ảnh để kiểm tra; không tự gửi lại thao tác. File đang chọn được giữ, hãy bỏ file đã có trên server trước khi tải tiếp."
        : missing ? "Sản phẩm hoặc ảnh không còn tồn tại. Tải lại dữ liệu để kiểm tra."
          : cause instanceof Error ? cause.message : "Không xử lý được ảnh.");
    } finally {
      running.current = false;
    }
  }

  return (
    <section aria-labelledby={`${inputId}-title`} aria-busy={busy} className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 id={`${inputId}-title`} className="text-lg font-semibold">Ảnh sản phẩm</h2>
      {!(product.images?.length) && <p>Chưa có ảnh sản phẩm.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(product.images ?? []).map((image) => (
          <li key={image.id} className="min-w-0 space-y-3 rounded-lg border border-border p-3">
            <ServerImage key={image.imageUrl} url={image.imageUrl} />
            <p className="text-sm wrap-anywhere">Ảnh #{image.id}{image.isPrimary === true ? " — Ảnh đại diện" : ""}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={locked || image.isPrimary === true} aria-label={`Chọn ảnh #${image.id} làm đại diện`} onClick={() => void perform({ kind: "primary", imageId: image.id })}>Chọn đại diện</Button>
              <Button type="button" variant="outline" disabled={locked} aria-label={`Xóa ảnh #${image.id}`} onClick={() => setDeleteId(image.id)}>Xóa ảnh</Button>
            </div>
            {deleteId === image.id && <div className="space-y-2" role="group" aria-label={`Xác nhận xóa ảnh #${image.id}`}>
              <p className="text-sm">Xóa ảnh này{image.isPrimary === true ? " (đang là ảnh đại diện)" : ""}? Máy chủ sẽ quyết định ảnh đại diện còn lại.</p>
              <div className="flex gap-2"><Button type="button" variant="destructive" disabled={locked} onClick={() => void perform({ kind: "delete", imageId: image.id })}>Xác nhận xóa</Button><Button type="button" variant="outline" disabled={locked} onClick={() => setDeleteId(null)}>Giữ ảnh</Button></div>
            </div>}
          </li>
        ))}
      </ul>
      <fieldset disabled={locked} className="space-y-3 border-t border-border pt-4">
        <legend className="px-2 font-medium">Thêm ảnh mới</legend>
        <label htmlFor={inputId} className="block text-sm">Chọn nhiều ảnh JPG, JPEG, PNG, WebP (tối đa 5 MiB/ảnh; tổng dưới 29 MiB)</label>
        <input id={inputId} type="file" multiple accept={imageUploadAccept} className="block w-full rounded-lg border border-input p-3 text-sm" onChange={(event) => {
          const selected = Array.from(event.currentTarget.files ?? []);
          setFiles((previous) => [...previous, ...selected]);
          event.currentTarget.value = "";
        }} />
        <ul className="space-y-2">{files.map((file, index) => {
          const result = imageUploadSchema.safeParse(file);
          return <li key={index} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
            {result.success && <LocalPreview file={file} />}
            <div className="min-w-0 flex-1 text-sm wrap-anywhere"><p>{file.name}</p>{!result.success && <p role="alert" className="text-destructive">{result.error.issues[0]?.message}</p>}</div>
            <Button type="button" variant="outline" aria-label={`Bỏ file ${index + 1}: ${file.name}`} onClick={() => setFiles((previous) => previous.filter((_, position) => position !== index))}>Bỏ file</Button>
          </li>;
        })}</ul>
        {files.length > 0 && !validation.success && <p role="alert" className="text-sm text-destructive">{validation.error.issues[0]?.message}</p>}
        <Button type="button" disabled={locked || !validation.success} onClick={() => void perform({ kind: "upload", files })}>Tải ảnh lên</Button>
      </fieldset>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {forbidden && <p role="alert">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
      {needsRefresh && <Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}>Tải lại ảnh để kiểm tra</Button>}
    </section>
  );
}
