import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/api/queryKeys";
import { useGuestCart } from "@/features/cart/guestCart.store";
import { useCartMerge } from "@/features/cart/cartMerge.store";
import { placeOrder } from "./api";
import { isCheckoutSessionCurrent } from "./session";
import { saveConfirmation } from "./confirmation.storage";
import type { CheckoutRequest, CheckoutSession, CheckoutSource } from "./types";

interface PlaceOrderVariables {
  payload: CheckoutRequest;
  session: CheckoutSession;
  source: CheckoutSource;
}

// Khóa trong tab, kể cả khi component checkout bị unmount rồi mở lại.
const pendingSessions = new Set<string>();

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    // Không giữ một đơn offline trong hàng đợi để tự gửi khi mạng trở lại.
    networkMode: "always",
    mutationFn: async ({ payload, session, source }: PlaceOrderVariables) => {
      const key = session.userId ?? "guest";
      if (pendingSessions.has(key)) throw new Error("Một yêu cầu đặt hàng đang được xử lý.");
      if (useCartMerge.getState().isMerging) throw new Error("Giỏ hàng đang được đồng bộ.");
      pendingSessions.add(key);

      try {
        const order = await placeOrder(payload, session);
        if (!isCheckoutSessionCurrent(session)) {
          throw new Error("Đơn đã được tạo nhưng phiên mua hàng đã thay đổi. Hãy kiểm tra đơn trong tài khoản ban đầu.");
        }

        const stored = saveConfirmation(order, session.userId);
        let cartSyncFailed = false;
        try {
          if (source.kind === "guestCart") {
            useGuestCart.getState().consumePurchased(payload.directItems ?? []);
          } else if (source.kind === "userCart") {
            await queryClient.invalidateQueries({
              queryKey: [...qk.cart, session.userId],
              exact: true,
              refetchType: "none",
            });
          }
        } catch {
          cartSyncFailed = true;
        }

        return { confirmation: { userId: session.userId, order }, stored, cartSyncFailed };
      } finally {
        pendingSessions.delete(key);
      }
    },
  });
}
