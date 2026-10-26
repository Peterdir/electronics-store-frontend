import type { Attributes, ID, Money } from "@/shared/types/common";


export interface AddToCartRequest {
  productVariantId: ID;
  quantity: number;
}

export interface CartItemResponse {
  id: ID;
  productVariantId: ID;
  productId: ID | null;
  productName: string;
  sku: string;
  imageUrl: string | null;
  attributes: Attributes | null;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
  availableStock: number;
  isOutOfStock: boolean;
  hasSufficientStock: boolean;
}

export interface CartResponse {
  id: ID;
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: Money;
}