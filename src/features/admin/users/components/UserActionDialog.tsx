import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { canChangeUserRole, canChangeUserStatus, USER_STATUS_LABELS } from "../policy";
import { isCurrentUsersSession, useUserAction, type UsersSession } from "../queries";
import { userActionSchema } from "../schemas";
import type { AdminUser } from "../types";

export interface UserActionProps {
  user: AdminUser;
  snapshot: UsersSession;
  blocked: boolean;
  onBlocked: () => void;
  onMissing: () => void;
  onNotice: (message: string) => void;
}

export function UserActionDialog({
  user, snapshot, blocked, onBlocked, onMissing, onNotice, kind,
}: UserActionProps & { kind: "status" | "role" }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(user.role);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const sending = useRef(false);
  const mounted = useRef(false);
  const fieldId = useId();
  const mutation = useUserAction(user, snapshot);
  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const title = kind === "role" ? "Đổi vai trò" : nextStatus === "INACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản";
  const allowed = kind === "role" ? canChangeUserRole(snapshot, user) : canChangeUserStatus(snapshot, user);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || busy || mutation.isPending || saved || blocked || !allowed || !isCurrentUsersSession(snapshot)) return;
    const parsed = userActionSchema.safeParse({ kind, value: kind === "role" ? role : nextStatus });
    if (!parsed.success || (kind === "role" && role === user.role)) {
      setMessage("Vui lòng chọn vai trò mới hợp lệ.");
      return;
    }

    sending.current = true;
    setBusy(true);
    setMessage("");
    let didSave = false;
    try {
      await mutation.mutateAsync(parsed.data);
      if (!isCurrentUsersSession(snapshot)) return;
      didSave = true;
      if (mounted.current) setSaved(true);
      onNotice("Đã lưu thay đổi. Đang cập nhật dữ liệu người dùng…");
    } catch (error) {
      if (!isCurrentUsersSession(snapshot)) return;
      if (error instanceof ApiError && error.status === 404) {
        onNotice("Người dùng không còn tồn tại.");
        onMissing();
      } else if (error instanceof ApiError && error.status === 400) {
        if (mounted.current) setMessage(error.message);
      } else {
        onBlocked();
        const notice = `${error instanceof Error ? error.message : "Chưa xác định kết quả."} Đã khóa gửi. Hãy đối chiếu kết quả máy chủ trước thao tác mới; GET sau timeout chưa chứng minh request cũ đã kết thúc.`;
        onNotice(notice);
        if (mounted.current) setMessage(notice);
      }
    } finally {
      try {
        await mutation.refresh();
        if (didSave && isCurrentUsersSession(snapshot)) {
          onNotice("Đã lưu và cập nhật dữ liệu người dùng.");
          if (mounted.current) setOpen(false);
        }
      } catch {
        if (isCurrentUsersSession(snapshot)) {
          onBlocked();
          const notice = didSave
            ? "Đã lưu nhưng tải dữ liệu mới thất bại. Đóng hộp thoại và nhấn F5; không gửi lại thao tác ghi."
            : "Chưa tải được dữ liệu để đối chiếu. Đóng hộp thoại và nhấn F5 để tải lại trang.";
          onNotice(notice);
          if (mounted.current) setMessage(notice);
        }
      } finally {
        sending.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }

  if (!allowed) return null;

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(next, event) => {
        if (busy || sending.current) event.cancel();
        else {
          if (next) {
            setRole(user.role);
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
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm wrap-anywhere">
            {user.fullName ?? "Người dùng"} • {user.email} • ID #{user.id}
          </Dialog.Description>
          <form onSubmit={(event) => { void submit(event); }} className="mt-5 space-y-4" aria-busy={busy}>
            {kind === "role" ? (
              <label htmlFor={fieldId} className="block space-y-2 text-sm">
                <span className="block">Vai trò hiện tại: {user.role}. Chọn vai trò mới:</span>
                <select
                  id={fieldId}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  disabled={busy || saved || blocked}
                  className="w-full rounded-lg border border-input bg-background p-2"
                >
                  {["ADMIN", "MANAGER", "STAFF", "CUSTOMER"].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <span className="block text-muted-foreground">Xác nhận thay đổi quyền của đúng tài khoản trên. Phiên đang mở của tài khoản đích cần được kiểm tra riêng.</span>
              </label>
            ) : (
              <p className="text-sm">Xác nhận chuyển từ “{USER_STATUS_LABELS[user.status]}” sang “{USER_STATUS_LABELS[nextStatus]}”?</p>
            )}
            <p role="status" className="text-sm leading-6">{message}</p>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>Đóng</Dialog.Close>
              <Button type="submit" disabled={busy || saved || blocked || mutation.isPending || (kind === "role" && role === user.role)}>
                {busy ? "Đang lưu…" : "Xác nhận"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
