import { formatVND } from "@/lib/format";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { Link } from "react-router";
import { useCartMerge } from "../cartMerge.store";
import { useGuestCart } from "../guestCart.store";


export function CartSummary({
  totalItems,
  totalPrice,
  hasIssues,
  disabled,
  onClear,
}: {
  totalItems: number;
  totalPrice: number;
  hasIssues: boolean;
  disabled: boolean;
  onClear: () => void;
}) {
  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id);
  const attempts = useCartMerge((state) => state.attempts);
  const guestItems = useGuestCart((state) => state.items);

  const needsMergeReview =
    Boolean(userId) &&
    attempts.some(
      (attempt) =>
        attempt.userId === userId &&
        guestItems.some((item) => item.variantId === attempt.variantId),
  );

  const canCheckout =
    totalItems > 0 &&
    !hasIssues &&
    !disabled &&
    !needsMergeReview &&
    (!token || (Boolean(userId) && !isExpired(token)));

  return (
    <aside className="space-y-3 rounded-md border p-4">
      <h2 className="text-lg font-semibold">Tóm tắt giỏ hàng</h2>
      <p>Tổng số lượng: {totalItems}</p>
      <p>Tạm tính: {formatVND(totalPrice)}</p>

      {hasIssues && (
        <p role="alert" className="text-sm text-destructive">
          Hãy xử lý sản phẩm hết hoặc thiếu hàng trước khi thanh toán.
        </p>
      )}

      {needsMergeReview && (
        <p role="alert" className="text-sm text-destructive">
          Hãy đối chiếu sản phẩm đang chờ đồng bộ trước khi thanh toán.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-destructive underline disabled:opacity-40"
        >
          Xóa tất cả
        </button>

        {canCheckout ? (
          <Link
            to="/checkout?source=cart"
            state={{ startedUserId: token ? userId : null }}
            className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Tiến hành thanh toán
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground opacity-50"
          >
            Tiến hành thanh toán
          </button>
        )}
      </div>
    </aside>
  );
}