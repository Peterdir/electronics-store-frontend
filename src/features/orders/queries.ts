import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { getOrders } from "./api";
import type { GetOrdersParams } from "./types";

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