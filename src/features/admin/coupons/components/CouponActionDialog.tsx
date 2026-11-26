import { Dialog } from "@base-ui/react/dialog";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { hasPermission } from "@/shared/auth/permissions";
import { isCouponResultUncertain, isCurrentCouponsSession, useCouponAction, type CouponAction, type CouponsSession } from "../queries";
import type { AdminCoupon } from "../types";
import { CouponForm } from "./CouponForm";

interface CouponActionDialogProps {
  coupon?: AdminCoupon;
  toggle?: boolean;
  snapshot: CouponsSession;
  blocked: boolean;
  onBlocked: () => void;
  onNotice: (message: string) => void;
}

export function CouponActionDialog({ coupon, toggle = false, snapshot, blocked, onBlocked, onNotice }: CouponActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const sending = useRef(false);
  const mutation = useCouponAction(snapshot);
  const title = toggle
    ? coupon?.active ? "Tắt coupon" : "Bật coupon"
    : coupon ? "Sửa coupon" : "Tạo coupon";

  async function execute(action: CouponAction) {
    if (sending.current || mutation.isPending || blocked || saved || !isCurrentCouponsSession(snapshot, true)) return;
    sending.current = true;
    setBusy(true);
    setMessage("");
    let didSave = false;
    try {
      await mutation.mutateAsync(action);
      if (!isCurrentCouponsSession(snapshot)) return;
      didSave = true;
      setSaved(true);
      onNotice("Đã lưu coupon. Đang cập nhật danh sách…");
    } catch (error) {
      if (!isCurrentCouponsSession(snapshot)) return;
      if (isCouponResultUncertain(error)) {
        onBlocked();
        const notice = "Chưa xác định kết quả ghi. Đã khóa thao tác trong lần mở trang này; không tự gửi lại. Hãy đối chiếu máy chủ trước khi thao tác mới. GET sau timeout chưa chứng minh request trước đã kết thúc.";
        setMessage(notice);
        onNotice(notice);
      } else {
        const detail = error instanceof ApiError && error.status === 409 && action.kind === "save"
          ? "Mã coupon đã tồn tại hoặc đang có cập nhật khác. Kiểm tra mã và thử lại."
          : error instanceof Error ? error.message : "Không thể lưu coupon.";
        setMessage(detail);
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) onBlocked();
      }
    } finally {
      try {
        await mutation.refresh();
        if (didSave && isCurrentCouponsSession(snapshot)) {
          onNotice("Đã lưu và cập nhật danh sách coupon.");
          setOpen(false);
        }
      } catch {
        if (isCurrentCouponsSession(snapshot)) {
          if (didSave) onBlocked();
          const notice = didSave
            ? "Đã lưu coupon nhưng tải lại dữ liệu thất bại. Nhấn F5 để tải lại trang; không gửi lại yêu cầu lưu."
            : "Không tải lại được dữ liệu coupon. Nhấn F5 để tải lại trang; giữ lại thông tin cần đối chiếu trước khi tải lại.";
          setMessage(notice);
          onNotice(notice);
        }
      } finally {
        sending.current = false;
        setBusy(false);
      }
    }
  }

  if (!hasPermission("coupon.manage", snapshot.role)) return null;

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(next, event) => {
        if (busy || sending.current) event.cancel();
        else {
          if (next) {
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
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {coupon ? `Mã: ${coupon.code} • #${coupon.id}` : "Thiết lập giá trị giảm, giới hạn lượt và thời gian hiệu lực."}
          </Dialog.Description>
          {toggle && coupon ? (
            <div className="mt-5 space-y-4">
              <p>Xác nhận {coupon.active ? "tắt" : "bật"} coupon này? Hiệu lực còn phụ thuộc thời gian và số lượt sử dụng.</p>
              <Button
                disabled={busy || mutation.isPending || blocked || saved}
                onClick={() => { void execute({ kind: "toggle", id: coupon.id }); }}
              >
                Xác nhận
              </Button>
            </div>
          ) : (
            <CouponForm
              coupon={coupon}
              disabled={busy || mutation.isPending || blocked || saved}
              onSave={(payload) => execute({ kind: "save", id: coupon?.id, payload })}
            />
          )}
          <p role="status" className="mt-4 text-sm leading-6">{message}</p>
          <div className="mt-4 flex justify-end">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>Đóng</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
