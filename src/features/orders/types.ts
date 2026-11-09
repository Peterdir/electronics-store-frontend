import type {
  ID,
  ISODateTime,
  Money,
} from "@/shared/types/common";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/shared/types/enums";

export interface OrderItemResponse {
  id: ID;
  variantId: ID | null;
  productName: string;
  variantSku: string;
  thumbnailUrl: string | null;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
}

export interface OrderListUserResponse {
  id: ID;
  totalPrice: Money;
  orderDate: ISODateTime;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalItems: number;
  canCancel: boolean;
  canPay: boolean;
  canBuyAgain: boolean;
  items: OrderItemResponse[];
}

export interface GetOrdersParams {
  orderStatus?: OrderStatus;
  page: number;
  size: number;
  sortBy: "createdAt";
  direction: "desc";
}