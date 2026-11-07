import { env } from "@/shared/config/env";
import type { CheckoutResponse } from "@/features/checkout/types";

export function getVnpayRedirectUrl(order: CheckoutResponse): string {
  if (!order.paymentUrl) {
    throw new Error("Máy chủ chưa cung cấp đường dẫn thanh toán.");
  }

  const backend = new URL(env.BACKEND_ORIGIN);
  const url = new URL(order.paymentUrl, backend.origin);

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.origin !== backend.origin ||
    url.pathname !== "/api/payments/vnpay/create" ||
    url.searchParams.get("orderId") !== order.orderId ||
    url.username ||
    url.password
  ) {
    throw new Error("Đường dẫn thanh toán không hợp lệ.");
  }

  return url.href;
}