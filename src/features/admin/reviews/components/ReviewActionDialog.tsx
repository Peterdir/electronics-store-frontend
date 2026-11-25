import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { hasPermission } from "@/shared/auth/permissions";
import { isCurrentReviewsSession, useAdminReviewAction, type ReviewsSession } from "../queries";
import { reviewReplySchema } from "../schemas";
import type { AdminReview, ReviewAction } from "../types";

export interface ReviewActionProps {
  review: AdminReview;
  snapshot: ReviewsSession;
  blocked: boolean;
  onBlocked: () => void;
  onMissing: () => void;
  onNotice: (message: string) => void;
}

export function ReviewActionDialog({
  review, snapshot, blocked, onBlocked, onMissing, onNotice, action,
}: ReviewActionProps & { action: ReviewAction }) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.adminReply ?? "");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const mounted = useRef(false);
  const fieldId = useId();
  const mutation = useAdminReviewAction(review.id, action, snapshot);
  const isReply = action === "reply";
  const title = isReply ? "Trả lời đánh giá" : review.hidden ? "Hiện đánh giá" : "Ẩn đánh giá";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || mutation.isPending || blocked || saved || !isCurrentReviewsSession(snapshot, action)) return;

    const parsed = isReply ? reviewReplySchema.safeParse({ replyText }) : null;
    if (parsed && !parsed.success) {
      setMessage(parsed.error.issues[0].message);
      return;
    }

    sending.current = true;
    setBusy(true);
    setMessage("");
    let didSave = false;

    try {
      await mutation.mutateAsync(parsed?.data);
      if (!isCurrentReviewsSession(snapshot)) return;

      didSave = true;
      if (mounted.current) setSaved(true);
      onNotice(isReply ? "Đã lưu câu trả lời. Đang tải lại dữ liệu…" : "Đã đổi trạng thái hiển thị. Đang tải lại dữ liệu…");
    } catch (error) {
      if (!isCurrentReviewsSession(snapshot)) return;

      if (error instanceof ApiError && error.status === 404) {
        onNotice("Đánh giá không còn tồn tại. Đang tải lại danh sách.");
        onMissing();
      } else if (isReply && error instanceof ApiError && error.status === 400) {
        if (mounted.current) setMessage(error.message);
      } else {
        onBlocked();
        const detail = error instanceof Error ? error.message : "Chưa xác định được kết quả.";
        const notice = `${detail} Không tự gửi lại. Hãy đối chiếu dữ liệu máy chủ trước khi thao tác mới; GET sau timeout chưa chứng minh request trước đã kết thúc.`;
        onNotice(notice);
        if (mounted.current) setMessage(notice);
      }
    } finally {
      try {
        await mutation.refreshRelated();
        if (didSave && isCurrentReviewsSession(snapshot)) {
          onNotice("Đã lưu và tải lại dữ liệu đánh giá.");
          if (mounted.current) setOpen(false);
        }
      } catch {
        if (isCurrentReviewsSession(snapshot)) {
          if (didSave) onBlocked();
          const notice = didSave
            ? "Đã lưu. Tải lại dữ liệu chưa thành công; đóng hộp thoại và nhấn F5 để tải lại trang, không gửi lại thao tác ghi."
            : "Chưa tải lại được dữ liệu để đối chiếu. Đóng hộp thoại và nhấn F5 để tải lại trang.";
          onNotice(notice);
          if (mounted.current) setMessage(notice);
        }
      } finally {
        sending.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }

  if (!hasPermission(isReply ? "review.reply" : "review.toggle", snapshot.role)) return null;

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(next, event) => {
        if (busy || sending.current) event.cancel();
        else {
          if (next) {
            if (saved) setReplyText(review.adminReply ?? "");
            setSaved(false);
            setMessage("");
          }
          setOpen(next);
        }
      }}
    >
      <Dialog.Trigger render={<Button variant="outline" disabled={blocked || mutation.isPending} />}>
        {title}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
          <Dialog.Title className="text-lg font-semibold">
            {title} #{review.id}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {review.productName ?? "Sản phẩm không còn thông tin"} • {review.customerName ?? "Khách hàng"}
          </Dialog.Description>
          <form
            noValidate
            onSubmit={(event) => { void submit(event); }}
            aria-busy={busy}
            className="mt-5 space-y-4"
          >
            <p className="whitespace-pre-wrap wrap-anywhere text-sm">
              {review.reviewText || "Đánh giá không có nội dung chữ."}
            </p>
            {isReply ? (
              <div className="space-y-2">
                <label htmlFor={fieldId} className="block text-sm font-medium">
                  Nội dung trả lời
                </label>
                <textarea
                  id={fieldId}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  disabled={busy || saved || blocked}
                  required
                  rows={5}
                  aria-describedby={`${fieldId}-message`}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Câu trả lời mới sẽ thay thế câu trả lời trước đó của cửa hàng.
                </p>
              </div>
            ) : (
              <p className="text-sm">
                Xác nhận {review.hidden ? "hiện lại" : "ẩn"} đánh giá này? Điểm trung bình sản phẩm do máy chủ quản lý.
              </p>
            )}
            <p id={`${fieldId}-message`} role="status" className="text-sm leading-6">
              {message || (blocked ? "Thao tác đã khóa trong lần mở trang này. Hãy đối chiếu kết quả trên máy chủ." : "")}
            </p>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>
                Đóng
              </Dialog.Close>
              <Button type="submit" disabled={busy || mutation.isPending || saved || blocked}>
                {busy ? "Đang lưu…" : isReply ? "Lưu trả lời" : "Xác nhận"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
