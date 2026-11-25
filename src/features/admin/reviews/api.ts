import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import { isPositiveLongId } from "@/shared/types/common";
import { reviewReplySchema, type ReviewReplyRequest } from "./schemas";
import type { AdminReview, MessageResponse, ReviewFilters } from "./types";

export async function getAdminReviews(filters: ReviewFilters, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<BackendPage<AdminReview>>("/api/admin/reviews", {
    params: {
      rating: filters.rating ?? undefined,
      productName: filters.productName || undefined,
      page: filters.page - 1,
      size: filters.size,
      sort: "createdAt,desc",
    },
    signal,
    meta: { authToken, noPublicRetry: true },
  });

  return normalizePage(data);
}

export async function toggleAdminReview(id: string, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã đánh giá không hợp lệ.");

  const { data } = await api.patch<MessageResponse>(
    `/api/admin/reviews/${id}/toggle-visibility`,
    undefined,
    { meta: { authToken, noPublicRetry: true } },
  );

  return data;
}

export async function replyAdminReview(id: string, payload: ReviewReplyRequest, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã đánh giá không hợp lệ.");

  const { data } = await api.post<MessageResponse>(
    `/api/admin/reviews/${id}/reply`,
    reviewReplySchema.parse(payload),
    { meta: { authToken, noPublicRetry: true } },
  );

  return data;
}
