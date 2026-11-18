import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { getWishlist, setProductWishlist } from "./api";
import type { WishlistChange, WishlistSession } from "./types";

function isCurrentSession({ userId, token }: WishlistSession) {
  const current = useSession.getState();
  return current.user?.id === userId && current.token === token && !isExpired(token);
}

function assertSession(session: WishlistSession) {
  if (!isCurrentSession(session)) {
    throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
  }
}

export function useWishlistState() {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);
  const authenticated = Boolean(userId && token && !isExpired(token));

  const query = useQuery({
    queryKey: [...qk.wishlist, userId],
    enabled: authenticated,
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      if (!userId || !token) throw new ApiError(401, "Vui lòng đăng nhập.");
      const session = { userId, token };
      assertSession(session);
      const items = await getWishlist(signal, token);
      assertSession(session);
      return items;
    },
  });

  const pendingChanges = useMutationState({
    filters: {
      mutationKey: [...qk.wishlist, userId, "write"],
      exact: true,
      status: "pending",
    },
    select: (mutation) => mutation.state.variables as WishlistChange | undefined,
  }).filter((change): change is WishlistChange => Boolean(
    authenticated && change && change.userId === userId && change.token === token,
  ));

  const productIds = new Set((query.data ?? []).map((item) => item.productId));
  for (const change of pendingChanges) {
    if (change.desired) productIds.add(change.productId);
    else productIds.delete(change.productId);
  }

  return { query, productIds, authenticated, busy: pendingChanges.length > 0 };
}

export function useSetWishlist() {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const mutationKey = [...qk.wishlist, userId, "write"];

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (input: WishlistChange) => {
      if (input.userId !== userId) {
        throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
      }
      assertSession(input);
      if (queryClient.isMutating({ mutationKey, exact: true }) > 1) {
        throw new ApiError(409, "Một thao tác yêu thích khác đang được xử lý.");
      }
      try {
        await setProductWishlist(input.productId, input.desired, input.token);
      } catch (error) {
        const alreadyRemoved = !input.desired && error instanceof ApiError && error.status === 404;
        if (!alreadyRemoved) throw error;
      }
      assertSession(input);
    },
    onSuccess: (_result, input) => {
      if (input.userId !== userId || !isCurrentSession(input)) return;
      toast.success(input.desired
        ? "Đã thêm vào danh sách yêu thích."
        : "Đã bỏ khỏi danh sách yêu thích.", {
          id: "wishlist-feedback",
          position: "bottom-right",
          duration: 1500,
        });
    },
    onError: (error, input) => {
      if (input.userId !== userId || !isCurrentSession(input)) return;
      toast.error(error instanceof ApiError
        ? error.message
        : "Không cập nhật được danh sách yêu thích.", {
          id: "wishlist-feedback",
          position: "bottom-right",
          duration: 3000,
        });
    },
    onSettled: async (_result, _error, input) => {
      if (input.userId !== userId || !isCurrentSession(input)) return;
      await queryClient.invalidateQueries({
        queryKey: [...qk.wishlist, input.userId],
        exact: true,
        refetchType: "all",
      });
    },
  });

  function submit(input: WishlistChange) {
    if (queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    mutation.mutate(input);
  }

  return { submit };
}
