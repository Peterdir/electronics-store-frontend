import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { adjustStockSchema, previewStock } from "../schemas";
import { isCurrentInventorySession, isStockResultUncertain, useAdjustStock, type InventorySession } from "../queries";
import type { AdjustStockRequest, InventoryResponse } from "../types";

export function AdjustStockDialog({ item, session, onClose, onHistory }: {
  item: InventoryResponse;
  session: InventorySession;
  onClose: () => void;
  onHistory: () => void;
}) {
  const [action, setAction] = useState<AdjustStockRequest["action"]>("ADD");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [stock, setStock] = useState(item.quantity);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [uncertainAttempt, setUncertainAttempt] = useState(false);
  const [reading, setReading] = useState(false);
  const submitting = useRef(false);
  const mutation = useAdjustStock(item.id, session);
  const parsed = adjustStockSchema.safeParse({ action, quantity, reason });
  const preview = parsed.success ? previewStock(stock, parsed.data.action, parsed.data.quantity) : null;
  const busy = mutation.isPending || reading;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const validPreview = preview !== null;

  async function submit() {
    if (
      submitting.current ||
      busy ||
      saved ||
      uncertainAttempt ||
      forbidden ||
      !parsed.success ||
      !validPreview ||
      !isCurrentInventorySession(session)
    ) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync(parsed.data);
      if (!isCurrentInventorySession(session)) return;
      setSaved(true);
      setReading(true);
      try {
        const latest = await mutation.reconcile();
        if (!isCurrentInventorySession(session)) return;
        setStock(latest.quantity);
        setMessage("Đã lưu điều chỉnh và tải lại tồn, lịch sử.");
      } catch (error) {
        if (isCurrentInventorySession(session)) {
          setMessage(`Đã lưu điều chỉnh, nhưng tải lại thất bại: ${error instanceof Error ? error.message : "Lỗi kết nối"}. Mở lịch sử để kiểm tra tồn hiện tại; không gửi lại điều chỉnh.`);
        }
      } finally { setReading(false); }
    } catch (error) {
      if (!isCurrentInventorySession(session)) return;
      const uncertain = isStockResultUncertain(error);
      setUncertainAttempt(uncertain);
      setMessage(`${error instanceof Error ? error.message : "Điều chỉnh thất bại"}${uncertain ? " Chưa xác định kết quả. Mở lịch sử để kiểm tra tồn hiện tại trước khi tạo thao tác mới." : ""}`);
    } finally { submitting.current = false; }
  }

  return (
    <Dialog.Root
      open={isCurrentInventorySession(session)}
      disablePointerDismissal
      onOpenChange={(open, event) => {
        if (busy || submitting.current) {
          event.cancel();
          return;
        }
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 text-card-foreground shadow-xl">
          <Dialog.Title className="text-lg font-semibold">
            Điều chỉnh tồn kho
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground wrap-anywhere">
            {item.productName || "Sản phẩm"} · {item.sku || "Chưa có SKU"} · Mã kho {item.id}.
            Tồn lần đọc gần nhất: {stock?.toLocaleString("vi-VN") ?? "Không xác định"}.
          </Dialog.Description>

          <form
            className="mt-4 space-y-4"
            aria-busy={busy}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset
              disabled={busy || saved || uncertainAttempt || forbidden}
              className="grid gap-4 disabled:opacity-60"
            >
              <label className="grid gap-1 text-sm">
                Hành động
                <select
                  className="rounded-lg border bg-background p-2"
                  value={action}
                  onChange={(event) => setAction(event.target.value === "DEDUCT" ? "DEDUCT" : "ADD")}
                >
                  <option value="ADD">Thêm kho (ADD)</option>
                  <option value="DEDUCT">Trừ kho (DEDUCT)</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                Số lượng
                <input
                  className="rounded-lg border bg-background p-2"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  aria-describedby="stock-preview"
                />
              </label>

              <label className="grid gap-1 text-sm">
                Lý do (không bắt buộc)
                <textarea
                  className="rounded-lg border bg-background p-2"
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            </fieldset>

            {!saved && (
              <p id="stock-preview" className="text-sm" role="status">
                {!parsed.success
                  ? parsed.error.issues[0]?.message
                  : validPreview
                    ? `Tồn dự tính: ${preview.toLocaleString("vi-VN")}. Backend kiểm tra lại khi lưu.`
                    : "Không thể dự tính: tồn chưa hợp lệ, trừ vượt tồn hoặc kết quả vượt giới hạn số nguyên an toàn. Hãy đọc lại dữ liệu."}
              </p>
            )}
            {message && (
              <p role={saved ? "status" : "alert"} className="text-sm">
                {message}
              </p>
            )}
            {uncertainAttempt && (
              <p role="alert" className="text-sm text-destructive">
                Lần gửi này bị khóa để tránh điều chỉnh lặp. Xem tồn và lịch sử; chỉ tạo thao tác mới sau khi đã xác minh kết quả với máy chủ.
              </p>
            )}
            {forbidden && (
              <p role="alert" className="text-sm text-destructive">
                Máy chủ từ chối quyền. Đăng nhập lại để cập nhật phiên.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                Đóng
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={onHistory}>
                Xem lịch sử
              </Button>
              {!saved && !uncertainAttempt && (
                <Button type="submit" disabled={busy || forbidden || !parsed.success || !validPreview}>
                  {mutation.isPending ? "Đang lưu…" : "Xác nhận điều chỉnh"}
                </Button>
              )}
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
