import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import {
  isCategoryResultUncertain, isCurrentCategorySession, useCategoryMutation,
  type CategorySession,
} from "../queries";
import type { AdminCategoryResponse } from "../types";

export function DeleteCategoryDialog({ category, session, onClose }: {
  category: AdminCategoryResponse;
  session: CategorySession;
  onClose: () => void;
}) {
  const submitting = useRef(false);
  const mutation = useCategoryMutation();
  const busy = mutation.isPending;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const failed = isCategoryResultUncertain(mutation.error) ||
    (mutation.error instanceof ApiError && mutation.error.status === 404);

  async function confirmDelete() {
    if (submitting.current || busy || failed || forbidden || !isCurrentCategorySession(session)) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync({ kind: "delete", id: category.id, session });
      if (isCurrentCategorySession(session)) onClose();
    } catch {
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Dialog.Root
      open={isCurrentCategorySession(session)}
      disablePointerDismissal
      onOpenChange={(open, event) => {
        if (busy || submitting.current) { event.cancel(); return; }
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6">
          <Dialog.Title className="text-lg font-semibold">Xóa danh mục?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground wrap-anywhere">
            Xóa “{category.name}” (#{category.id}) và ảnh của danh mục. Thao tác này không thể hoàn tác.
            Chỉ xóa được danh mục không còn sản phẩm; máy chủ kiểm tra lại khi xác nhận.
          </Dialog.Description>
          <p className="mt-3 text-sm">Số sản phẩm ở lần tải gần nhất: {category.totalProducts}.</p>
          {mutation.error && <p role="alert" className="mt-3 text-sm text-destructive">{mutation.error.message}</p>}
          {failed && <p role="alert" className="mt-2 text-sm text-destructive">Hãy đóng và kiểm tra danh sách trước khi thao tác lại.</p>}
          {forbidden && <p role="alert" className="mt-2 text-sm text-destructive">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
          <div aria-busy={busy} className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>Giữ danh mục</Dialog.Close>
            <Button type="button" variant="destructive" disabled={busy || failed || forbidden} onClick={() => { void confirmDelete(); }}>
              {busy ? "Đang xóa…" : "Xác nhận xóa"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
