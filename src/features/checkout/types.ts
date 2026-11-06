import { z } from "zod";
import type { ID } from "@/shared/types/common";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/shared/types/enums";
import type { ShippingMethod } from "./checkoutOptions";

export interface CheckoutItem {
  productVariantId: ID;
  quantity: number;
}

export type CheckoutAddress =
  | { addressId: ID; recipientName?: never; recipientPhone?: never; shippingAddress?: never }
  | { addressId?: never; recipientName: string; recipientPhone: string; shippingAddress: string };

export type CheckoutSource =
  | { kind: "userCart" }
  | { kind: "guestCart"; items: CheckoutItem[] }
  | { kind: "buyNow"; item: CheckoutItem };

export type CheckoutRequest = CheckoutAddress & {
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  contactEmail?: string;
  directItems?: CheckoutItem[];
};

export interface CheckoutSession {
  userId: ID | null;
  token: string | null;
}

const money = z.number().nonnegative();
const id = z.string().min(1);

export const checkoutResponseSchema = z.object({
  orderId: id,
  recipientName: z.string(),
  recipientPhone: z.string(),
  shippingAddress: z.string(),
  subtotal: money,
  shippingFee: money,
  couponCode: z.string().nullish(),
  discountAmount: money,
  totalPrice: money,
  orderStatus: z.enum(OrderStatus),
  paymentStatus: z.enum(PaymentStatus),
  paymentMethod: z.enum(PaymentMethod),
  createdAt: z.iso.datetime(),
  items: z.array(z.object({
    id,
    variantId: id.nullish(),
    productName: z.string(),
    variantSku: z.string(),
    thumbnailUrl: z.string().nullish(),
    unitPrice: money,
    quantity: z.number().int().positive(),
    subtotal: money,
  })).min(1),
  message: z.string(),
  paymentUrl: z.string().nullish(),
  isGuestOrder: z.boolean(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
