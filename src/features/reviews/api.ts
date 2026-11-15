import { api } from "@/shared/api/client";
import type { CreateReviewRequest, PendingReview, ReviewResponse } from "./types";

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
