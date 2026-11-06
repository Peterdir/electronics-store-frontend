import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { isCheckoutSessionCurrent } from "./session";
import { checkoutResponseSchema, type CheckoutRequest, type CheckoutSession } from "./types";

export async function placeOrder(payload: CheckoutRequest, session: CheckoutSession) {
  if (!isCheckoutSessionCurrent(session)) {
    throw new ApiError(401, "Phiên mua hàng đã thay đổi. Hãy bắt đầu lại checkout.");
  }

  const response = await api.post<unknown>("/api/orders/checkout", payload, {
    meta: { noPublicRetry: true, checkoutSession: session },
  });
  const result = checkoutResponseSchema.safeParse(response.data);
  if (!result.success || result.data.isGuestOrder !== (session.userId === null) ||
      result.data.paymentMethod !== payload.paymentMethod) {
    throw new ApiError(0, "Máy chủ đã phản hồi nhưng thông tin xác nhận đơn không hợp lệ.");
  }
  return result.data;
}
