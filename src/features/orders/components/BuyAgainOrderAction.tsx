import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useCartMerge } from "@/features/cart/cartMerge.store";
import { isCurrentCartSession, useCartWriteState } from "@/features/cart/cartWrite";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { useBuyAgainOrder } from "../queries";
import { BuyAgainResultDialog } from "./BuyAgainResultDialog";

export function BuyAgainOrderAction({
  orderId,
  canBuyAgain,
  refreshing,
}: {
  orderId: ID;
  canBuyAgain: boolean;
  refreshing: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);
  const isMerging = useCartMerge((state) => state.isMerging);
  const needsMergeReview = useCartMerge((state) =>
    state.attempts.some((attempt) => attempt.userId === userId),
  );
  const cartBusy = useCartWriteState((state) => Boolean(userId && state.busyUsers.has(userId)));
  const mutation = useBuyAgainOrder(orderId);
  const { needsRetryConfirmation } = mutation;
  const matchesSession = Boolean(mutation.variables && isCurrentCartSession(mutation.variables));
  const result = matchesSession ? mutation.data : undefined;
  const error = matchesSession ? mutation.error : null;
  const disabled = !userId || !token || refreshing || mutation.isPending ||
    Boolean(result) || cartBusy || isMerging || needsMergeReview;

  if (!canBuyAgain && !result && !error) return null;

  return (
    <div className="space-y-2 border-t border-border pt-3" aria-busy={mutation.isPending}>
      {canBuyAgain && (
        <Button
          ref={trigger}
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => {
            if (disabled || submitting.current || !userId || !token) return;
            const retryConfirmed = needsRetryConfirmation && window.confirm(
              "Lần mua lại trước có thể đã thêm hàng vào giỏ. Bạn đã kiểm tra số lượng và muốn mua lại lần nữa?",
            );
            if (needsRetryConfirmation && !retryConfirmed) return;

            submitting.current = true;
            void mutation.mutateAsync({ userId, token, retryConfirmed }).catch(() => undefined).finally(() => {
              submitting.current = false;
            });
          }}
        >
          {mutation.isPending ? "Đang thêm vào giỏ…" : "Mua lại"}
        </Button>
      )}
      {needsRetryConfirmation && !result ? (
        <p role="alert" className="text-sm">
          Chưa xác định được kết quả mua lại.{" "}
          <Link to="/cart" className="text-primary underline">Xem giỏ hàng</Link>
          {" "}để kiểm tra số lượng trước khi thử lại.
        </p>
      ) : needsMergeReview ? (
        <p className="text-sm">
          <Link to="/cart" className="text-primary underline">Đối chiếu giỏ hàng</Link>
          {" "}trước khi mua lại.
        </p>
      ) : isMerging ? (
        <p role="status" className="text-sm text-muted-foreground">Đang đồng bộ giỏ hàng…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">{error.message}</p>
      ) : null}
      <BuyAgainResultDialog result={result} onClose={mutation.reset} trigger={trigger} />
    </div>
  );
}
