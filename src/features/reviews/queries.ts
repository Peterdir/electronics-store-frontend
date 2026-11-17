import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { createReview, deleteReview, getPendingReviews, getReviewHistory, updateReview } from "./api";
import type { CreateReviewRequest, PendingReview, ReviewResponse, UpdateReviewRequest } from "./types";

interface ReviewSession {
  userId: ID;
  token: string;
}

export function isCurrentReviewSession({ userId, token }: ReviewSession) {
  const current = useSession.getState();
  return current.user?.id === userId && current.token === token && !isExpired(token);
}

function assertReviewSession(session: ReviewSession) {
  if (!isCurrentReviewSession(session)) {
    throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
  }
}

function useReviewList<T>(
  kind: "pending" | "history",
  load: (signal: AbortSignal, token: string) => Promise<T>,
  enabled: boolean,
) {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.reviews, userId, kind],
    enabled: Boolean(enabled && userId && token && !isExpired(token)),
    retry: false,
    staleTime: kind === "pending" ? 0 : 30_000,
    queryFn: async ({ signal }) => {
      if (!userId || !token) {
        throw new ApiError(401, "Vui lòng đăng nhập.");
      }

      const session = { userId, token };
      assertReviewSession(session);
      const data = await load(signal, token);
      assertReviewSession(session);
      return data;
    },
  });
}

export function usePendingReviews(enabled = true) {
  return useReviewList("pending", getPendingReviews, enabled);
}

export function useReviewHistory(enabled = true) {
  return useReviewList("history", getReviewHistory, enabled);
}

export function useCreateReview(userId: ID | undefined, orderItemId: ID) {
  const queryClient = useQueryClient();
  const mutationKey = [...qk.reviews, userId, "create", orderItemId] as const;

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (input: ReviewSession & { payload: CreateReviewRequest; image?: File }) => {
      assertReviewSession(input);
      const review = await createReview(input.payload, input.token, input.image);
      assertReviewSession(input);
      return review;
    },
    onSuccess: (_review, input) => {
      if (!isCurrentReviewSession(input)) return;

      queryClient.setQueryData<PendingReview[]>(
        [...qk.reviews, input.userId, "pending"],
        (items) => items?.filter((item) => item.orderItemId !== input.payload.orderItemId),
      );
      void queryClient.invalidateQueries({ queryKey: [...qk.reviews, input.userId] });
      void queryClient.invalidateQueries({ queryKey: qk.products });
      toast.success("Đã gửi đánh giá.");
    },
    onError: (error, input) => {
      if (!isCurrentReviewSession(input) || !(error instanceof ApiError)) return;

      if (error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: [...qk.reviews, input.userId] });
        toast.info("Bạn đã đánh giá dòng đơn hàng này.");
      } else if (error.status === 404) {
        void queryClient.invalidateQueries({
          queryKey: [...qk.reviews, input.userId, "pending"],
        });
        toast.error("Sản phẩm hoặc dòng đơn hàng không còn khả dụng để đánh giá.");
      } else if (error.status === 0 || error.status >= 500) {
        void queryClient.invalidateQueries({ queryKey: [...qk.reviews, input.userId] });
      }
    },
  });

  return { mutation, mutationKey };
}

export function useManageReview(userId: ID | undefined, reviewId: ID) {
  const queryClient = useQueryClient();
  const mutationKey = [...qk.reviews, userId, "manage", reviewId] as const;
  type Input = ReviewSession & (
    | { action: "update"; payload: UpdateReviewRequest; image?: File }
    | { action: "delete" }
  );

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (input: Input) => {
      assertReviewSession(input);
      if (queryClient.isMutating({ mutationKey, exact: true }) > 1) {
        throw new ApiError(409, "Đánh giá này đang được xử lý.");
      }
      const review = input.action === "update"
        ? await updateReview(reviewId, input.payload, input.token, input.image)
        : await deleteReview(reviewId, input.token);
      assertReviewSession(input);
      return review;
    },
    onSuccess: async (review, input) => {
      if (!isCurrentReviewSession(input)) return;
      const key = [...qk.reviews, input.userId];
      await queryClient.cancelQueries({ queryKey: key });
      if (!isCurrentReviewSession(input)) return;

      queryClient.setQueryData<ReviewResponse[]>([...key, "history"], (items) => {
        if (input.action === "delete") return items?.filter((item) => item.id !== reviewId);
        return items?.map((item) => item.id === reviewId && review ? review : item);
      });
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: qk.products });
      toast.success(input.action === "update" ? "Đã cập nhật đánh giá." : "Đã xóa đánh giá.");
    },
    onError: (error, input) => {
      if (!isCurrentReviewSession(input) || !(error instanceof ApiError)) return;
      if (error.status === 403 || error.status === 404 || error.status === 0 || error.status >= 500) {
        void queryClient.invalidateQueries({ queryKey: [...qk.reviews, input.userId] });
      }
      if (error.status === 404) toast.info("Đánh giá này không còn khả dụng.");
    },
  });

  return { mutation, mutationKey };
}
