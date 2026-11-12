import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { cancelOrder, getOrderDetail, getOrders } from "./api";
import type { GetOrdersParams } from "./types";
import type { ID } from "@/shared/types/common";
import { toast } from "sonner";
import type { CancelOrderValues } from "./schemas";

export function useGetOrders(
  params: GetOrdersParams,
  enabled = true,
) {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.orders, userId, "list", params],

    enabled: Boolean(
      enabled &&
      userId &&
      token &&
      !isExpired(token),
    ),

    retry: false,

    queryFn: async ({ signal }) => {
      function assertCurrentSession() {
        const current = useSession.getState();

        if (
          !userId ||
          !token ||
          isExpired(token) ||
          current.user?.id !== userId ||
          current.token !== token
        ) {
          throw new ApiError(
            401,
            "Phiên đăng nhập đã thay đổi.",
          );
        }
      }

      assertCurrentSession();

      if (!token) {
        throw new ApiError(401, "Vui lòng đăng nhập.");
      }

      const result = await getOrders(params, signal, token);

      assertCurrentSession();

      return result;
    },
  });
}

export function isCurrentOrdersSession(userId: ID, token: string) {
  const current = useSession.getState();

  return current.user?.id === userId &&
    current.token === token &&
    !isExpired(token);
}

function assertOrdersSession(userId: ID, token: string) {
  if (!isCurrentOrdersSession(userId, token)) {
    throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
  }
}

export function useOrderDetail(orderId: ID | undefined) {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.orders, userId, "detail", orderId],
    enabled: Boolean(orderId && userId && token && !isExpired(token)),
    retry: false,

    queryFn: async ({ signal }) => {
      if (!orderId || !userId || !token) {
        throw new ApiError(400, "Thiếu mã đơn hoặc phiên đăng nhập.");
      }

      assertOrdersSession(userId, token);

      try {
        const detail = await getOrderDetail(orderId, signal, token);
        assertOrdersSession(userId, token);
        return detail;
      } catch (error) {
        if (!signal.aborted && error instanceof ApiError && error.status === 404) {
          assertOrdersSession(userId, token);
          void queryClient.invalidateQueries({
            queryKey: [...qk.orders, userId, "list"],
          });
        }

        throw error;
      }
    },
  });
}

export function useCancelOrder(orderId: ID) {
  const queryClient = useQueryClient();
  const mutationKey = [...qk.orders, "cancel", orderId];
  const pendingCount = useIsMutating({ mutationKey, exact: true });

  function invalidateStock(userId: ID) {
    void queryClient.invalidateQueries({ queryKey: qk.products });
    void queryClient.invalidateQueries({ queryKey: [...qk.cart, userId] });
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,

    mutationFn: ({ userId, token, payload }: {
      userId: ID;
      token: string;
      payload: CancelOrderValues;
    }) => {
      assertOrdersSession(userId, token);
      return cancelOrder(orderId, payload, token);
    },

    onSuccess: async (detail, { userId, token }) => {
      if (!isCurrentOrdersSession(userId, token)) return;

      const detailKey = [...qk.orders, userId, "detail", orderId];
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true });

      if (!isCurrentOrdersSession(userId, token)) return;

      queryClient.setQueryData(detailKey, detail);
      void queryClient.invalidateQueries({
        queryKey: [...qk.orders, userId, "list"],
      });
      invalidateStock(userId);
      toast.success(detail.message ?? "Đã hủy đơn hàng.");
    },

    onError: async (error, { userId, token }) => {
      if (
        !isCurrentOrdersSession(userId, token) ||
        !(error instanceof ApiError) ||
        error.fieldErrors?.reason ||
        !([0, 400, 403, 404, 409].includes(error.status) || error.status >= 500)
      ) return;

      const detailKey = [...qk.orders, userId, "detail", orderId];
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true });

      if (!isCurrentOrdersSession(userId, token)) return;

      const latest = await queryClient.fetchQuery({
        queryKey: detailKey,
        retry: false,
        staleTime: 0,
        networkMode: "always",
        queryFn: async ({ signal }) => {
          assertOrdersSession(userId, token);
          const detail = await getOrderDetail(orderId, signal, token);
          assertOrdersSession(userId, token);
          return detail;
        },
      }).catch(() => undefined);

      if (!isCurrentOrdersSession(userId, token)) return;

      void queryClient.invalidateQueries({
        queryKey: [...qk.orders, userId, "list"],
      });
      if (!latest) return;

      if (latest.orderStatus === "CANCELLED") {
        invalidateStock(userId);
        toast.success("Đơn hàng đã được hủy.");
      } else if (!latest.canCancel) {
        toast.error(error.message);
      }
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending || pendingCount > 0,
  };
}