import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/features/orders/orderStatus";
import { ApiError } from "@/shared/api/errors";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { canCancelAdminOrder } from "../orderActions";
import {
  isCurrentAdminOrdersSession, useCancelAdminOrder, type CancelAdminOrderVariables,
} from "../queries";
import { cancelAdminOrderSchema, type CancelAdminOrderValues } from "../schemas";
import type { OrderDetailAdminResponse } from "../types";

interface Props {
  order: OrderDetailAdminResponse;
  disabled: boolean;
}

export function AdminCancelOrderDialog({ order, disabled }: Props) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  const [confirmation, setConfirmation] = useState<Omit<CancelAdminOrderVariables, "payload"> | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);
  const reasonId = useId();
  const submitting = useRef(false);
  const mounted = useRef(false);
  const mutation = useCancelAdminOrder(order.id);
  const {
    register, handleSubmit, clearErrors, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<CancelAdminOrderValues>({
    resolver: zodResolver(cancelAdminOrderSchema),
    defaultValues: { reason: "" },
  });

  const busy = isSubmitting || mutation.isPending;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const eligible = canCancelAdminOrder(order.orderStatus);
  const sameSession = confirmation !== null &&
    confirmation.userId === userId && confirmation.role === role && confirmation.token === token;
  const statusChanged = confirmation !== null && confirmation.expectedStatus !== order.orderStatus;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function openConfirmation() {
    if (
      disabled || busy || submitting.current || forbidden || !eligible || !userId || !role || !token ||
      !isCurrentAdminOrdersSession(userId, role, token) || !hasPermission("order.cancel", role)
    ) return;
    clearErrors();
    setRequestFailed(false);
    setConfirmation({ userId, role, token, expectedStatus: order.orderStatus });
  }

  async function submit(payload: CancelAdminOrderValues) {
    if (
      !confirmation || !sameSession || submitting.current || mutation.isPending || disabled ||
      requestFailed || statusChanged || forbidden || !eligible
    ) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync({ ...confirmation, payload });
      if (mounted.current && isCurrentAdminOrdersSession(confirmation.userId, confirmation.role, confirmation.token)) {
        setConfirmation(null);
        reset();
      }
    } catch (cause) {
      if (!mounted.current || !isCurrentAdminOrdersSession(confirmation.userId, confirmation.role, confirmation.token)) return;
      setRequestFailed(true);
      const reasonError = cause instanceof ApiError ? cause.fieldErrors?.reason : undefined;
      if (reasonError) setError("reason", { type: "server", message: reasonError });
      setError("root.server", {
        message: cause instanceof Error ? cause.message : "Không thể xác nhận kết quả hủy đơn hàng.",
      });
    } finally {
      submitting.current = false;
    }
  }

  if (!hasPermission("order.cancel", role) || (!eligible && !sameSession && !forbidden)) return null;

  return (
    <div className="space-y-2">
      {forbidden && (
        <p role="alert" className="text-sm text-destructive">
          Máy chủ từ chối quyền hủy đơn. Vui lòng đăng nhập lại để cập nhật phiên và quyền truy cập.
        </p>
      )}
      <Dialog.Root
        open={sameSession}
        disablePointerDismissal
        onOpenChange={(nextOpen, event) => {
          if (busy || submitting.current) {
            event.cancel();
            return;
          }
          if (nextOpen) openConfirmation();
          else setConfirmation(null);
        }}
      >
        {eligible && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-semibold">Hủy đơn hàng</p>
              <p className="mt-1 text-sm text-muted-foreground">Chỉ hủy khi đơn chờ xác nhận hoặc đang xử lý. Cần ghi rõ lý do.</p>
            </div>
            <Dialog.Trigger render={<Button variant="destructive" disabled={disabled || busy || forbidden} className="shrink-0 gap-2" />}>
              <XCircle aria-hidden="true" className="size-4" />
              Hủy đơn hàng
            </Dialog.Trigger>
          </div>
        )}
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6">
            <Dialog.Title className="text-lg font-semibold">Xác nhận hủy đơn hàng</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Nhập lý do hủy đơn #{order.id}. Trạng thái hiện tại: {orderStatusLabels[order.orderStatus]}.
              {order.paymentStatus === "PAID" && " Nếu hủy thành công, thanh toán sẽ chờ hoàn tiền; chưa có nghĩa tiền đã được hoàn."}
            </Dialog.Description>
            <form noValidate aria-busy={busy} className="mt-4 space-y-4" onSubmit={(event) => { void handleSubmit(submit)(event); }}>
              <div className="space-y-2">
                <label htmlFor={reasonId} className="block text-sm font-medium">Lý do hủy đơn <span aria-hidden="true">*</span></label>
                <textarea
                  {...register("reason")}
                  id={reasonId}
                  required
                  rows={4}
                  readOnly={busy}
                  aria-invalid={Boolean(errors.reason)}
                  aria-describedby={errors.reason ? `${reasonId}-error` : undefined}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                />
                {errors.reason && <p id={`${reasonId}-error`} role="alert" className="text-sm text-destructive">{errors.reason.message}</p>}
              </div>
              {statusChanged && <p role="alert" className="text-sm text-destructive">Trạng thái đơn đã thay đổi. Hãy đóng hộp thoại và kiểm tra dữ liệu mới.</p>}
              {requestFailed && (
                <div role="alert" className="space-y-1 text-sm text-destructive">
                  <p>{errors.root?.server?.message}</p>
                  <p>Hãy đối chiếu kết quả trên máy chủ trước khi thao tác mới. Đóng hộp thoại và nhấn F5 để tải lại trang; lý do chưa lưu sẽ bị xóa.</p>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>
                  {requestFailed || statusChanged ? "Đóng" : "Giữ đơn hàng"}
                </Dialog.Close>
                <Button type="submit" variant="destructive" disabled={busy || disabled || requestFailed || statusChanged || forbidden || !eligible} className="gap-2">
                  {busy && <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
                  {busy ? "Đang xử lý…" : "Xác nhận hủy đơn"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
