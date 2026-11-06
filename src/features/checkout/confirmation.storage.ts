import { z } from "zod";
import { checkoutResponseSchema, type CheckoutResponse } from "./types";
import type { ID } from "@/shared/types/common";

const confirmationSchema = z.object({
  userId: z.string().min(1).nullable(),
  order: checkoutResponseSchema,
}).refine((value) => value.order.isGuestOrder === (value.userId === null));

export type OrderConfirmation = z.infer<typeof confirmationSchema>;
const storageKey = (orderId: ID) => `ec.checkout.confirmation.${orderId}`;

export function parseConfirmation(value: unknown, orderId: ID, userId: ID | null) {
  const result = confirmationSchema.safeParse(value);
  return result.success && result.data.order.orderId === orderId && result.data.userId === userId
    ? result.data
    : null;
}

export function saveConfirmation(order: CheckoutResponse, userId: ID | null): boolean {
  try {
    sessionStorage.setItem(storageKey(order.orderId), JSON.stringify({ userId, order }));
    return true;
  } catch {
    return false;
  }
}

export function readConfirmation(orderId: ID, userId: ID | null): OrderConfirmation | null {
  try {
    const raw = sessionStorage.getItem(storageKey(orderId));
    return raw ? parseConfirmation(JSON.parse(raw), orderId, userId) : null;
  } catch {
    return null;
  }
}
