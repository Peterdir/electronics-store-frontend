import type { OrderStatus } from "@/shared/types/enums";
import type { UpdateOrderStatusValues } from "./schemas";

type FulfillmentStatus = UpdateOrderStatusValues["newStatus"];

const nextStatuses: Partial<Record<OrderStatus, FulfillmentStatus>> = {
  PENDING: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export function getNextFulfillmentStatus(status: OrderStatus): FulfillmentStatus | undefined {
  return nextStatuses[status];
}

export function canUpdateFulfillmentStatus(current: OrderStatus, next: FulfillmentStatus) {
  return getNextFulfillmentStatus(current) === next;
}

export function canCancelAdminOrder(status: OrderStatus) {
  return status === "PENDING" || status === "PROCESSING";
}
