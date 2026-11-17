import { api } from "@/shared/api/client";
import type { ID } from "@/shared/types/common";
import type {
  CreateReviewRequest,
  PendingReview,
  ReviewResponse,
  UpdateReviewRequest,
} from "./types";

export async function getPendingReviews(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<PendingReview[]>("/api/reviews/me/pending", {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function getReviewHistory(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<ReviewResponse[]>("/api/reviews/me/history", {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

function buildReviewFormData(payload: CreateReviewRequest, image: File) {
  const body = new FormData();
  body.append("rating", String(payload.rating));
  body.append("productId", payload.productId);
  body.append("orderItemId", payload.orderItemId);
  if (payload.productVariantId !== undefined) {
    body.append("productVariantId", payload.productVariantId);
  }
  if (payload.reviewText) {
    body.append("reviewText", payload.reviewText);
  }
  body.append("image", image);
  return body;
}

export async function createReview(payload: CreateReviewRequest, authToken: string, image?: File) {
  const body = image ? buildReviewFormData(payload, image) : payload;
  const { data } = await api.post<ReviewResponse>("/api/reviews", body, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateReview(
  reviewId: ID,
  payload: UpdateReviewRequest,
  authToken: string,
  image?: File,
) {
  if (image && payload.removeImage) {
    throw new Error("Hãy chọn thay ảnh hoặc bỏ ảnh hiện tại.");
  }

  let body: UpdateReviewRequest | FormData = payload;

  if (image) {
    const form = new FormData();
    form.append("rating", String(payload.rating));
    form.append("reviewText", payload.reviewText ?? "");
    form.append("image", image);
    body = form;
  }

  const { data } = await api.put<ReviewResponse>(`/api/reviews/${reviewId}`, body, {
    meta: { authToken, noPublicRetry: true },
  });

  return data;
}

export async function deleteReview(reviewId: ID, authToken: string): Promise<void> {
  await api.delete<void>(`/api/reviews/${reviewId}`, {
    meta: { authToken, noPublicRetry: true },
  });
}
