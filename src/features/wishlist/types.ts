import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { ProductStatus } from "@/shared/types/enums";

export interface WishlistItemResponse {
  id: ID;
  productId: ID;
  productName: string;
  price: Money;
  primaryImageUrl: string | null;
  inStock: boolean;
  productStatus: ProductStatus;
  addedAt: ISODateTime;
}

export interface WishlistSession {
  userId: ID;
  token: string;
}

export interface WishlistChange extends WishlistSession {
  productId: ID;
  desired: boolean;
}
