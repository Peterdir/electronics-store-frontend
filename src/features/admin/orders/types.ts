import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus } from "@/shared/types/enums";

export interface CancelAdminOrderRequest {
  reason: string;
}

export interface AdminOrderItemResponse {
  id: ID;
  variantId: ID | null;
  productName: string;
  variantSku: string | null;
  thumbnailUrl: string | null;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
  returnStatus: ReturnStatus | null;
}

export interface OrderDetailAdminResponse {
  id: ID;
  userId: ID | null;
  customerName: string | null;
  customerEmail: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  shippingAddress: string | null;
  subtotal: Money;
  shippingFee: Money;
  couponCode: string | null;
  discountAmount: Money;
  totalPrice: Money;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  cancelReason: string | null;
  cancelledAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  message: string | null;
  items: AdminOrderItemResponse[];
}

export interface OrderListAdminResponse {
  id: ID;
  customerName: string | null;
  customerEmail: string | null;
  totalPrice: Money;
  orderDate: ISODateTime;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export type AdminOrderSortBy = "createdAt" | "totalPrice";
export type SortDirection = "asc" | "desc";

export interface AdminOrdersFilters {
  keyword: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page: number;
  size: number;
  sortBy: AdminOrderSortBy;
  direction: SortDirection;
}

export type GetAdminOrdersParams = AdminOrdersFilters;
