import type {
  OrderStatus,
  PaymentStatus,
} from "@/shared/types/enums";
import type { StatusTone } from "@/shared/components/StatusBadge";

export function isDeliveredOrderStatus(status: OrderStatus) {
  return ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "RETURN_REJECTED"].includes(status);
}

export const orderStatusLabels = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Yêu cầu trả hàng",
  RETURNED: "Đã trả hàng",
  RETURN_REJECTED: "Từ chối trả hàng",
} satisfies Record<OrderStatus, string>;

export const orderStatusTones = {
  PENDING: "pending",
  PROCESSING: "active",
  SHIPPED: "active",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURN_REQUESTED: "pending",
  RETURNED: "returned",
  RETURN_REJECTED: "danger",
} satisfies Record<OrderStatus, StatusTone>;

export const paymentStatusLabels = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  PENDING_REFUND: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
} satisfies Record<PaymentStatus, string>;
