import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { getOrderDetail, getOrders } from "./api";
import type { GetOrdersParams } from "./types";
import type { ID } from "@/shared/types/common";

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

function assertOrdersSession(userId: string, token: string) {
  const current = useSession.getState();

  if (
    current.user?.id !== userId ||
    current.token !== token ||
    isExpired(token)
  ) {
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