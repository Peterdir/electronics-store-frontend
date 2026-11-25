import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/shared/auth/permissions";
import { isCurrentReturnsSession, useProcessReturn, type ReturnsSession } from "../queries";
import { processReturnSchema } from "../schemas";
import type { AdminReturnRequest } from "../types";

interface Props {
  request: AdminReturnRequest;
  snapshot: ReturnsSession;
  blocked: boolean;
  onBlocked: () => void;
  onSaved: (request: AdminReturnRequest) => void;
  onBusyChange: (busy: boolean) => void;
}

export function ProcessReturnDialog({
  request, snapshot, blocked, onBlocked, onSaved, onBusyChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const mounted = useRef(false);
  const fieldId = useId();
  const mutation = useProcessReturn(request.id, snapshot);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      sending.current || mutation.isPending || blocked || saved ||
      request.status !== "PENDING" || !isCurrentReturnsSession(snapshot, true)
    ) return;
    const parsed = processReturnSchema.safeParse({ status, rejectReason: reason });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0].message);
      return;
    }
    sending.current = true;
    setBusy(true);
    onBusyChange(true);
    let didSave = false;
    try {
      const result = await mutation.mutateAsync(parsed.data);
      if (!mounted.current || !isCurrentReturnsSession(snapshot, true)) return;
      didSave = true;
      setSaved(true);
      onSaved(result);
      setMessage("Đã lưu kết quả xử lý. Đang tải lại dữ liệu…");
    } catch (error) {
      if (!mounted.current || !isCurrentReturnsSession(snapshot)) return;
      onBlocked();
      setMessage(`${error instanceof Error ? error.message : "Chưa xác định được kết quả."} Không gửi lại tự động. Hãy tải lại và đối chiếu trạng thái; nếu mất kết nối, dữ liệu PENDING chưa chứng minh lần xử lý trước đã kết thúc.`);
    }
    try {
      await mutation.refreshRelated();
      if (didSave && mounted.current && isCurrentReturnsSession(snapshot)) setMessage("Đã lưu và tải lại dữ liệu liên quan.");
    } catch {
      if (mounted.current && isCurrentReturnsSession(snapshot)) {
        setMessage(didSave ? "Đã lưu. Tải lại dữ liệu chưa thành công; đóng hộp thoại rồi dùng Tải lại danh sách, không gửi lại xử lý." : "Không thể tải lại dữ liệu để đối chiếu. Đóng hộp thoại rồi dùng Tải lại danh sách để kiểm tra kết quả trên máy chủ.");
      }
    } finally {
      sending.current = false;
      if (mounted.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }

  if (!hasPermission("return.process", snapshot.role)) return null;

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(next, event) => {
        if (busy || sending.current) event.cancel();
        else setOpen(next);
      }}
    >
      <Dialog.Trigger render={<Button disabled={request.status !== "PENDING" && !saved} />}>
        Xử lý yêu cầu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
          <Dialog.Title className="text-lg font-semibold">Xử lý yêu cầu #{request.id}</Dialog.Title>
          <form
            noValidate
            onSubmit={(event) => { void submit(event); }}
            aria-busy={busy}
            className="mt-5 space-y-4"
          >
            <fieldset disabled={busy || saved || blocked || request.status !== "PENDING"} className="space-y-4">
              <legend className="sr-only">Kết quả xử lý</legend>
              <label htmlFor={`${fieldId}-status`} className="block text-sm font-medium">
                Quyết định
              </label>
              <select
                id={`${fieldId}-status`}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value === "REJECTED" ? "REJECTED" : "APPROVED");
                  setMessage("");
                }}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm"
              >
                <option value="APPROVED">Duyệt trả hàng</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              {status === "REJECTED" && (
                <div className="space-y-2">
                  <label htmlFor={fieldId} className="block text-sm font-medium">
                    Lý do từ chối (bắt buộc)
                  </label>
                  <textarea
                    id={fieldId}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    required
                    rows={4}
                    aria-describedby={`${fieldId}-message`}
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm"
                  />
                </div>
              )}
            </fieldset>
            {message && (
              <p id={`${fieldId}-message`} role="status" className="text-sm leading-6">{message}</p>
            )}
            {blocked && (
              <p role="alert" className="text-sm text-destructive">
                Lần xử lý này đã khóa. Hãy đối chiếu với máy chủ trước khi tạo thao tác mới.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>Đóng</Dialog.Close>
              {!saved && !blocked && (
                <Button type="submit" disabled={busy || mutation.isPending || request.status !== "PENDING"}>
                  {busy ? "Đang xử lý…" : "Xác nhận"}
                </Button>
              )}
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
