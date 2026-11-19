import type { OrderDetailUserResponse } from "@/features/orders/types";
import { isDeliveredOrderStatus } from "@/features/orders/orderStatus";

const returnWindowMs = 7 * 24 * 60 * 60 * 1000;

export function getReturnEligibility(
  order: Pick<OrderDetailUserResponse, "orderStatus" | "updatedAt" | "returnDeadline">,
  now = Date.now(),
) {
  const deadline = order.returnDeadline
    ? Date.parse(order.returnDeadline)
    : Date.parse(order.updatedAt) + returnWindowMs;
  if (!isDeliveredOrderStatus(order.orderStatus)) {
    return { error: "Chỉ đơn hàng đã giao mới có thể yêu cầu trả hàng." } as const;
  }
  if (!Number.isFinite(deadline)) {
    return { error: "Không xác định được hạn trả hàng của đơn này." } as const;
  }
  if (now > deadline) {
    return { error: "Đã hết thời hạn 7 ngày để gửi yêu cầu trả hàng." } as const;
  }
  return { deadline } as const;
}
