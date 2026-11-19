import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { getAdminOrders } from "./api";
import type { GetAdminOrdersParams } from "./types";

export function useAdminOrders(params: GetAdminOrdersParams, enabled = true) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.admin, userId, role, "orders", "list", params],
    enabled: Boolean(
      enabled && userId && token && !isExpired(token) && hasPermission("order.view", role),
    ),
    retry: false,
    queryFn: async ({ signal }) => {
      function assertCurrentSession() {
        const current = useSession.getState();
        if (
          !userId || !token || isExpired(token) ||
          current.user?.id !== userId ||
          current.user?.role !== role ||
          current.token !== token ||
          !hasPermission("order.view", current.user?.role)
        ) {
          throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
        }
      }

      assertCurrentSession();
      if (!token) throw new ApiError(401, "Vui lòng đăng nhập.");
      const result = await getAdminOrders(params, signal, token);
      signal.throwIfAborted();
      assertCurrentSession();
      return result;
    },
  });
}
