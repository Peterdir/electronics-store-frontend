import { env } from "@/shared/config/env";

interface VnpayRedirectInput {
  orderId: string;
  paymentUrl?: string | null;
}

export function getVnpayRedirectUrl(order: VnpayRedirectInput): string {
  if (!order.paymentUrl) {
    throw new Error("Máy chủ chưa cung cấp đường dẫn thanh toán.");
  }

  const backend = new URL(env.BACKEND_ORIGIN);
  let url: URL;
  try {
    url = new URL(order.paymentUrl, backend.origin);
  } catch {
    throw new Error("Đường dẫn thanh toán không hợp lệ.");
  }

  const orderIds = url.searchParams.getAll("orderId");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.origin !== backend.origin ||
    url.pathname !== "/api/payments/vnpay/create" ||
    orderIds.length !== 1 ||
    orderIds[0] !== order.orderId ||
    url.username ||
    url.password
  ) {
    throw new Error("Đường dẫn thanh toán không hợp lệ.");
  }

  return url.href;
}
