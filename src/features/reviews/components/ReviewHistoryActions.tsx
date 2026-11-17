import { Dialog } from "@base-ui/react/dialog";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import { isCurrentReviewSession, useManageReview } from "../queries";
import type { ReviewResponse } from "../types";
import { ReviewDialog } from "./ReviewDialog";

export function ReviewHistoryActions({ review, canSubmit }: {
  review: ReviewResponse;
  canSubmit: boolean;
}) {
  const [editing, setEditing] = useState<ReviewResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const editButton = useRef<HTMLButtonElement>(null);
  const userId = useSession((state) => state.user?.id);
  const queryClient = useQueryClient();
  const { mutation, mutationKey } = useManageReview(userId, review.id);
  const busy = useIsMutating({ mutationKey, exact: true }) > 0;

  function closeEditor() {
    setEditing(null);
  }

  function confirmDelete() {
    if (!canSubmit || queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    const { token } = useSession.getState();
    if (!userId || !token || !isCurrentReviewSession({ userId, token })) {
      setError("Phiên đăng nhập đã thay đổi.");
      return;
    }
    const session = { userId, token };
    setError(undefined);
    mutation.mutate({ ...session, action: "delete" }, {
      onSuccess: () => {
        if (isCurrentReviewSession(session)) setDeleting(false);
      },
      onError: (failure) => {
        if (!isCurrentReviewSession(session)) return;
        setError(failure instanceof ApiError && (failure.status === 0 || failure.status >= 500)
          ? "Chưa xác nhận được kết quả xóa. Hãy đóng hộp thoại và tải lại danh sách trước khi thử lại."
          : failure.message);
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button
          ref={editButton}
          type="button"
          variant="outline"
          className="h-10 gap-2 px-3.5"
          disabled={busy || !canSubmit}
          aria-haspopup="dialog"
          aria-expanded={editing !== null}
          onClick={() => { if (!editing) setEditing(review); }}
        >
          <Pencil aria-hidden="true" />
          Sửa đánh giá
        </Button>
        <Dialog.Root
          open={deleting}
          disablePointerDismissal
          onOpenChange={(open, event) => {
            if (queryClient.isMutating({ mutationKey, exact: true }) > 0) {
              event.cancel();
              return;
            }
            setError(undefined);
            setDeleting(open);
          }}
        >
          <Dialog.Trigger
            render={<Button type="button" variant="ghost" className="h-10 gap-2 px-3.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={busy || !canSubmit || editing !== null} />}
          >
            <Trash2 aria-hidden="true" />
            Xóa đánh giá
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
            <Dialog.Popup
              aria-busy={busy}
              className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground"
            >
              <Dialog.Title className="text-lg font-semibold">Xóa đánh giá?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Đánh giá của bạn cho {review.productName} sẽ bị xóa.
              </Dialog.Description>
              {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>
                  Giữ đánh giá
                </Dialog.Close>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy || !canSubmit}
                  onClick={confirmDelete}
                >
                  {busy ? "Đang xóa…" : "Xác nhận xóa"}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      {editing && (
        <ReviewDialog
          open
          review={editing}
          canSubmit={canSubmit}
          onClose={closeEditor}
          finalFocus={editButton}
        />
      )}
    </div>
  );
}
