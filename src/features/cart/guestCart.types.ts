import type { Attributes, ID, Money } from "@/shared/types/common";

export interface GuestCartItem {
  variantId: ID;
  quantity: number;
  snapshot: {
    productId: ID;
    name: string;
    sku: string;
    price: Money;
    image: string | null;
    attributes: Attributes | null;
    stock: number;
  };
}

export type AddGuestCartResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid" | "out-of-stock" | "exceeds-stock";
      remaining?: number;
    };