import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { isCurrentOrdersSession, useCancelOrder } from "../queries";
import { cancelOrderSchema, type CancelOrderValues } from "../schemas";

export function CancelOrderDialog({ orderId }: { orderId: ID }) {
  const [open, setOpen] = useState(false);
  const reasonId = useId();
  const submitting = useRef(false);
  const mounted = useRef(false);
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);
  const mutation = useCancelOrder(orderId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CancelOrderValues>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const busy = isSubmitting || mutation.isPending;

  async function submit(payload: CancelOrderValues) {
    if (
      submitting.current || mutation.isPending || !userId || !token ||
      !isCurrentOrdersSession(userId, token)
    ) return;

    submitting.current = true;
    try {
      await mutation.mutateAsync({ userId, token, payload });
    } catch (error) {
      if (!mounted.current || !isCurrentOrdersSession(userId, token)) return;

      const reasonError = error instanceof ApiError ? error.fieldErrors?.reason : undefined;
      if (reasonError) {
        setError("reason", { type: "server", message: reasonError });
      } else {
        setError("root.server", {
          message: error instanceof Error ? error.message : "Không thể hủy đơn hàng.",
        });
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, event) => {
        if (busy || submitting.current) {
          event.cancel();
          return;
        }

        if (!nextOpen) reset();
        setOpen(nextOpen);
      }}
    >
      <Dialog.Trigger render={<Button variant="destructive" disabled={busy} />}>
        Hủy đơn hàng
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <Dialog.Title className="text-lg font-semibold">Hủy đơn hàng</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Nhập lý do hủy đơn #{orderId}.
          </Dialog.Description>

          <form
            noValidate
            aria-busy={busy}
            className="mt-4 space-y-3"
            onSubmit={(event) => { void handleSubmit(submit)(event); }}
          >
            <label htmlFor={reasonId} className="block text-sm font-medium">
              Lý do hủy
            </label>
            <textarea
              {...register("reason")}
              id={reasonId}
              required
              rows={3}
              readOnly={busy}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? `${reasonId}-error` : undefined}
              className="w-full rounded-lg border border-input bg-background p-2 focus-visible:outline-2 focus-visible:outline-ring"
            />
            {errors.reason && (
              <p id={`${reasonId}-error`} role="alert" className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
            {errors.root?.server && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.server.message}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>
                Giữ đơn hàng
              </Dialog.Close>
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? "Đang xử lý…" : "Xác nhận hủy"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}