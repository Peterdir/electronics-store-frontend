import type {
  ID,
  ISODateTime,
  Money,
} from "@/shared/types/common";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReturnStatus,
} from "@/shared/types/enums";
import type { CartResponse } from "../cart/types";

export interface OrderItemResponse {
  id: ID;
  variantId: ID | null;
  productName: string;
  variantSku: string;
  thumbnailUrl: string | null;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
  returnStatus?: ReturnStatus | null;
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

export interface OrderDetailUserResponse {
  id: ID;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
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
  returnDeadline?: ISODateTime | null;
  canCancel: boolean;
  canPay: boolean;
  canBuyAgain: boolean;
  message?: string | null;
  items: OrderItemResponse[];
}

export interface OrderPaymentResponse {
  orderId: ID;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalPrice: Money;
  message: string;
  paymentUrl: string | null;
}

export interface BuyAgainResponse {
  message: string;
  addedItemsCount: number;
  unavailableItemsCount: number;
  addedItemNames: string[];
  unavailableItemNames: string[];
  cart: CartResponse;
}
