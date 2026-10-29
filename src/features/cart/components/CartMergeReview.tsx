import { toast } from "sonner";
import { useSession } from "@/shared/auth/session.store";
import type { CartItemResponse } from "../types";
import { useCartMerge, type MergeAttempt } from "../cartMerge.store";
import { useGuestCart } from "../guestCart.store";
import { startGuestCartMerge } from "../mergeGuestCart";

interface CartMergeReviewProps {
  serverItems: CartItemResponse[];
  isMerging: boolean;
  isRefreshing: boolean;
  onRefetch: () => void;
}

export function CartMergeReview({
  serverItems,
  isMerging,
  isRefreshing,
  onRefetch,
}: CartMergeReviewProps) {
  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id);
  const guestItems = useGuestCart((state) => state.items);
  const attempts = useCartMerge((state) => state.attempts);

  const unresolved = attempts.filter((attempt) =>
    guestItems.some((item) => item.variantId === attempt.variantId),
  );

  if (isMerging || unresolved.length === 0) return null;

  function confirmTransferred(attempt: MergeAttempt) {
    if (
      useCartMerge.getState().isMerging ||
      isRefreshing ||
      userId !== attempt.userId
    ) return;

    const guestItem = useGuestCart.getState().items.find(
      (item) => item.variantId === attempt.variantId,
    );
    if (!guestItem) {
      useCartMerge.getState().resolve(attempt.userId, attempt.variantId);
      return;
    }

    if (!window.confirm(
      `Chỉ xác nhận khi ${attempt.quantity} chiếc ${attempt.name} đã có trong giỏ tài khoản. Xóa số lượng đã chuyển khỏi bản lưu guest?`,
    )) return;

    const remaining = guestItem.quantity - attempt.quantity;
    if (remaining > 0) {
      useGuestCart.getState().setQuantity(attempt.variantId, remaining);
    } else {
      useGuestCart.getState().remove(attempt.variantId);
    }
    useCartMerge.getState().resolve(attempt.userId, attempt.variantId);
    toast.success("Đã cập nhật bản lưu guest của sản phẩm.");
  }

  function retryTransfer(attempt: MergeAttempt) {
    if (
      useCartMerge.getState().isMerging ||
      isRefreshing ||
      !token ||
      userId !== attempt.userId
    ) return;

    const guestItem = useGuestCart.getState().items.find(
      (item) => item.variantId === attempt.variantId,
    );
    if (!guestItem) {
      useCartMerge.getState().resolve(attempt.userId, attempt.variantId);
      return;
    }

    if (!window.confirm(
      `Request trước có thể đã thành công. Gửi lại ${guestItem.quantity} chiếc ${attempt.name} có thể cộng trùng. Bạn đã đối chiếu giỏ server và vẫn muốn thử lại?`,
    )) return;

    useCartMerge.getState().resolve(attempt.userId, attempt.variantId);
    void startGuestCartMerge(token, userId, attempt.variantId).catch(() => {
      toast.error("Không thể chuyển sản phẩm. Bản lưu guest vẫn được giữ.");
    });
  }

  return (
    <section
      aria-label="Sản phẩm cần đối chiếu sau khi đồng bộ"
      className="space-y-3 rounded-md border p-4"
    >
      <h2 className="font-semibold">Cần đối chiếu giỏ hàng</h2>
      <p className="text-sm">
        Một số request chưa rõ kết quả. Hãy tải lại giỏ server và kiểm tra
        số lượng trước khi xác nhận hoặc thử chuyển lại.
      </p>
      <button
        type="button"
        onClick={onRefetch}
        disabled={isRefreshing}
        className="text-primary underline disabled:opacity-40"
      >
        {isRefreshing ? "Đang tải giỏ server…" : "Tải lại giỏ server"}
      </button>
      <ul className="space-y-3">
        {unresolved.map((attempt) => {
          const belongsToCurrentUser = attempt.userId === userId;
          const serverQuantity = serverItems.find(
            (item) => item.productVariantId === attempt.variantId,
          )?.quantity ?? 0;
          const guestQuantity = guestItems.find(
            (item) => item.variantId === attempt.variantId,
          )?.quantity ?? 0;

          return (
            <li
              key={`${attempt.userId}:${attempt.variantId}`}
              className="space-y-2 rounded-md border p-3"
            >
              <p>{attempt.name}: đã thử chuyển {attempt.quantity} chiếc.</p>
              {belongsToCurrentUser ? (
                <>
                  <p className="text-sm">
                    Hiện trong giỏ tài khoản: {serverQuantity} chiếc;
                    còn lưu trên thiết bị: {guestQuantity} chiếc.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      disabled={isRefreshing}
                      onClick={() => confirmTransferred(attempt)}
                      className="text-primary underline disabled:opacity-40"
                    >
                      Đã có trong giỏ tài khoản
                    </button>
                    <button
                      type="button"
                      disabled={isRefreshing}
                      onClick={() => retryTransfer(attempt)}
                      className="text-primary underline disabled:opacity-40"
                    >
                      Thử chuyển lại
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm">
                  Sản phẩm này đang chờ đối chiếu với tài khoản khác.
                  Hãy đăng nhập tài khoản đó để xử lý.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
