import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, Check, CircleCheck, LoaderCircle, PackageCheck, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/features/orders/orderStatus";
import { cn } from "@/lib/utils";
import { ApiError } from "@/shared/api/errors";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { OrderStatus } from "@/shared/types/enums";
import { getNextFulfillmentStatus } from "../orderActions";
import {
  isCurrentAdminOrdersSession,
  useUpdateAdminOrderStatus,
  type UpdateAdminOrderStatusVariables,
} from "../queries";
import type { OrderDetailAdminResponse } from "../types";

interface Props {
  order: OrderDetailAdminResponse;
  disabled: boolean;
}

const fulfillmentIcons = {
  PROCESSING: PackageCheck,
  SHIPPED: Truck,
  DELIVERED: CircleCheck,
};

function OrderStatusTransition({ from, to }: { from: OrderStatus; to: OrderStatus }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
      <div className="min-w-0 rounded-xl border border-border bg-background px-3 py-3">
        <p className="text-xs font-medium text-muted-foreground">Hiện tại</p>
        <p className="mt-1 text-sm font-medium text-foreground wrap-anywhere">{orderStatusLabels[from]}</p>
      </div>
      <ArrowRight aria-hidden="true" className="size-4 self-center text-muted-foreground" />
      <div className={cn(
        "min-w-0 rounded-xl border px-3 py-3",
        to === "DELIVERED"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
          : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200",
      )}>
        <p className="text-xs font-medium">Sau khi xác nhận</p>
        <p className="mt-1 text-base font-bold wrap-anywhere">{orderStatusLabels[to]}</p>
      </div>
    </div>
  );
}

export function UpdateOrderStatusDialog({ order, disabled }: Props) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  const [confirmation, setConfirmation] = useState<UpdateAdminOrderStatusVariables | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(false);
  const mutation = useUpdateAdminOrderStatus(order.id);
  const nextStatus = getNextFulfillmentStatus(order.orderStatus);
  const NextStatusIcon = nextStatus ? fulfillmentIcons[nextStatus] : ArrowRight;
  const busy = mutation.isPending;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const sameSession = confirmation !== null &&
    confirmation.userId === userId && confirmation.role === role && confirmation.token === token;
  const statusChanged = confirmation !== null && confirmation.expectedStatus !== order.orderStatus;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function openConfirmation() {
    if (
      disabled || busy || submitting.current || forbidden || !nextStatus || !userId || !role || !token ||
      !isCurrentAdminOrdersSession(userId, role, token) || !hasPermission("order.updateStatus", role)
    ) return;
    setError(null);
    setConfirmation({ userId, role, token, expectedStatus: order.orderStatus, payload: { newStatus: nextStatus } });
  }

  async function submit() {
    if (!confirmation || !sameSession || submitting.current || busy || disabled || error || statusChanged) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync(confirmation);
      if (mounted.current && isCurrentAdminOrdersSession(confirmation.userId, confirmation.role, confirmation.token)) {
        setConfirmation(null);
      }
    } catch (cause) {
      if (!mounted.current || !isCurrentAdminOrdersSession(confirmation.userId, confirmation.role, confirmation.token)) return;
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      submitting.current = false;
    }
  }

  if (!hasPermission("order.updateStatus", role)) return null;

  return (
    <div className="space-y-2">
      {forbidden && (
        <p role="alert" className="text-sm text-destructive">
          Máy chủ từ chối quyền cập nhật. Vui lòng đăng nhập lại để cập nhật phiên và quyền truy cập.
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
        {nextStatus && (
          <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            <p className="text-sm font-semibold">Bước xử lý tiếp theo</p>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <div className="min-w-0 flex-1">
                <OrderStatusTransition from={order.orderStatus} to={nextStatus} />
              </div>
              <Dialog.Trigger render={
                <Button
                  disabled={disabled || busy || forbidden}
                  aria-label={`Chuyển sang trạng thái ${orderStatusLabels[nextStatus]}`}
                  className="h-auto min-h-14 w-full gap-3 rounded-xl px-4 py-3 whitespace-normal shadow-sm lg:w-auto lg:min-w-52"
                />
              }>
                <NextStatusIcon aria-hidden="true" className="size-5" />
                <span className="text-left">
                  <span className="block text-xs font-medium">Chuyển sang</span>
                  <span className="block text-base font-bold leading-6">{orderStatusLabels[nextStatus]}</span>
                </span>
                <ArrowRight aria-hidden="true" className="ml-auto size-4" />
              </Dialog.Trigger>
            </div>
          </div>
        )}
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Popup
            aria-busy={busy}
            className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
          >
            <Dialog.Title className="text-lg font-semibold">Xác nhận chuyển trạng thái</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Kiểm tra trạng thái mới của đơn #{order.id} trước khi xác nhận.
            </Dialog.Description>
            {confirmation && (
              <div className="mt-5">
                <OrderStatusTransition from={confirmation.expectedStatus} to={confirmation.payload.newStatus} />
              </div>
            )}
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => { event.preventDefault(); void submit(); }}
            >
              {statusChanged && (
                <p role="alert" className="text-sm text-destructive">
                  Trạng thái đơn đã thay đổi. Hãy đóng hộp thoại và chọn lại từ dữ liệu mới.
                </p>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error} Hãy đóng hộp thoại và kiểm tra dữ liệu trước khi chọn lại.</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} className="h-10 px-4" />}>
                  {error || statusChanged ? "Đóng" : "Quay lại"}
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={busy || disabled || Boolean(error) || statusChanged}
                  className="h-auto min-h-10 gap-2 px-4 py-2 whitespace-normal"
                >
                  {busy ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
                  {busy ? "Đang cập nhật…" : `Xác nhận: ${confirmation ? orderStatusLabels[confirmation.payload.newStatus] : "chuyển trạng thái"}`}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
