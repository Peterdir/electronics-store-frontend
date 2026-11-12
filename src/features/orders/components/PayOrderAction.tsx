import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { isCurrentOrdersSession, usePayOrder } from "../queries";

interface Props {
  orderId: ID;
  canPay: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function PayOrderAction({ orderId, canPay, refreshing, onRefresh }: Props) {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);
  const mutation = usePayOrder(orderId);
  const submitting = useRef(false);
  const mounted = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const [failure, setFailure] = useState<{
    userId: ID;
    token: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    mounted.current = true;

    function resetRedirect(event: PageTransitionEvent) {
      if (event.persisted) {
        submitting.current = false;
        setRedirecting(false);
      }
    }

    window.addEventListener("pageshow", resetRedirect);
    return () => {
      mounted.current = false;
      window.removeEventListener("pageshow", resetRedirect);
    };
  }, []);

  const busy = mutation.isPending || redirecting;
  const message = failure && failure.userId === userId && failure.token === token
    ? failure.message
    : null;

  async function handlePay() {
    if (
      !canPay || refreshing || busy || submitting.current ||
      !userId || !token || !isCurrentOrdersSession(userId, token)
    ) return;

    submitting.current = true;
    setFailure(null);

    let navigationStarted = false;
    try {
      const url = await mutation.mutateAsync({ userId, token });
      if (!mounted.current || !isCurrentOrdersSession(userId, token)) return;

      setRedirecting(true);
      try {
        window.location.assign(url);
        navigationStarted = true;
      } catch {
        setRedirecting(false);
        throw new Error("Không mở được trang thanh toán VNPay.");
      }
    } catch (error) {
      if (!mounted.current || !isCurrentOrdersSession(userId, token)) return;

      let message = error instanceof Error ? error.message : "Không thể mở thanh toán.";
      if (error instanceof ApiError && error.message === "Order is already paid.") {
        message = "Đơn hàng đã được thanh toán.";
      }
      setFailure({ userId, token, message });
    } finally {
      if (!navigationStarted) submitting.current = false;
    }
  }

  if (!canPay && !message) return null;

  return (
    <div className="space-y-2 border-t border-border pt-3" aria-busy={busy}>
      {canPay && (
        <Button
          type="button"
          className="w-full"
          disabled={busy || refreshing}
          onClick={() => void handlePay()}
        >
          {busy ? "Đang mở VNPay…" : "Thanh toán qua VNPay"}
        </Button>
      )}
      {message && (
        <>
          <p role="alert" className="text-sm text-destructive">{message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || refreshing}
            onClick={() => {
              setFailure(null);
              onRefresh();
            }}
          >
            Tải lại chi tiết đơn
          </Button>
        </>
      )}
    </div>
  );
}
