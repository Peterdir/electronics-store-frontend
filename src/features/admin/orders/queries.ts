import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId } from "@/shared/types/common";
import type { Role } from "@/shared/types/enums";
import { getAdminOrderDetail, getAdminOrders } from "./api";
import type { GetAdminOrdersParams } from "./types";

function assertCurrentSession(
  userId: string | undefined,
  role: Role | undefined,
  token: string | null,
): asserts token is string {
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

export function useAdminOrderDetail(orderId: string | undefined) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.admin, userId, role, "orders", "detail", orderId],
    enabled: Boolean(
      isPositiveLongId(orderId) && userId && token &&
      !isExpired(token) && hasPermission("order.view", role),
    ),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isPositiveLongId(orderId)) throw new ApiError(400, "Mã đơn hàng không hợp lệ.");
      assertCurrentSession(userId, role, token);
      const result = await getAdminOrderDetail(orderId, signal, token);
      signal.throwIfAborted();
      assertCurrentSession(userId, role, token);
      return result;
    },
  });
}

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
      assertCurrentSession(userId, role, token);
      const result = await getAdminOrders(params, signal, token);
      signal.throwIfAborted();
      assertCurrentSession(userId, role, token);
      return result;
    },
  });
}
