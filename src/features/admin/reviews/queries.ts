import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminReviews, replyAdminReview, toggleAdminReview } from "./api";
import type { ReviewReplyRequest } from "./schemas";
import type { ReviewAction, ReviewFilters } from "./types";

export interface ReviewsSession {
  userId: string;
  role: Role;
  token: string;
}

export function useReviewsSession(): ReviewsSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);

  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentReviewsSession(snapshot: ReviewsSession, action?: ReviewAction) {
  const current = useSession.getState();
  const permission = action === "toggle" ? "review.toggle" : action === "reply" ? "review.reply" : "review.view";

  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission(permission, snapshot.role);
}

export function useAdminReviews(filters: ReviewFilters, snapshot: ReviewsSession) {
  return useQuery({
    queryKey: [...qk.admin, snapshot.userId, snapshot.role, "reviews", "list", filters],
    enabled: isCurrentReviewsSession(snapshot),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isCurrentReviewsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      signal.throwIfAborted();

      const data = await getAdminReviews(filters, signal, snapshot.token);

      signal.throwIfAborted();
      if (!isCurrentReviewsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}

export function useAdminReviewAction(id: string, action: ReviewAction, snapshot: ReviewsSession) {
  const client = useQueryClient();
  const prefix = [...qk.admin, snapshot.userId, snapshot.role];
  const mutationKey = [...prefix, "reviews", "write", id];
  const pendingCount = useIsMutating({ mutationKey });
  const relatedKeys = [
    [...prefix, "reviews"],
    [...prefix, "products"],
    qk.reviews,
    qk.products,
  ];

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (payload: ReviewReplyRequest | undefined) => {
      if (!isCurrentReviewsSession(snapshot, action)) throw new ApiError(403, "Phiên hoặc quyền đánh giá đã thay đổi.");
      if (client.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Đánh giá này đang được cập nhật.");

      const result = action === "toggle"
        ? await toggleAdminReview(id, snapshot.token)
        : await replyAdminReview(id, payload ?? { replyText: "" }, snapshot.token);

      if (!isCurrentReviewsSession(snapshot, action)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSettled: async () => {
      if (!isCurrentReviewsSession(snapshot)) return;
      await Promise.all(relatedKeys.map((queryKey) => client.cancelQueries({ queryKey })));
      if (!isCurrentReviewsSession(snapshot)) return;
      await Promise.all(relatedKeys.map((queryKey) => client.invalidateQueries({ queryKey, refetchType: "none" })));
    },
  });

  async function refreshRelated() {
    if (!isCurrentReviewsSession(snapshot)) return;
    await Promise.all(relatedKeys.map((queryKey) =>
      client.refetchQueries({ queryKey, type: "active" }, { throwOnError: true }),
    ));
  }

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0, refreshRelated };
}
