import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { OrderStatus, PaymentStatus } from "@/shared/types/enums";

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
