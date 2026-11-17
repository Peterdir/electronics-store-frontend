import type { ID, ISODateTime } from "@/shared/types/common";

interface ReviewProductInfo {
  productName: string;
  productImage: string | null;
  variantAttributes: Record<string, unknown> | null;
}

export interface PendingReview extends ReviewProductInfo {
  orderItemId: ID;
  orderId: ID;
  productId: ID;
  productVariantId: ID | null;
  orderDate: ISODateTime;
}

export interface ReviewResponse extends ReviewProductInfo {
  id: ID;
  productId: ID | null;
  productDeleted?: boolean;
  isProductDeleted?: boolean;
  rating: number;
  reviewText: string | null;
  imageUrl: string | null;
  createdAt: ISODateTime;
}

export interface CreateReviewRequest {
  rating: number;
  reviewText?: string;
  productId: ID;
  productVariantId?: ID;
  orderItemId: ID;
}

export interface UpdateReviewRequest {
  rating: number;
  reviewText?: string;
  removeImage?: boolean;
}
