import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { getAdminInventory } from "./api";
import type { InventoryParams } from "./types";

export function useAdminInventory(params: InventoryParams, enabled = true) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  function isCurrentSession() {
    const current = useSession.getState();
    return Boolean(token && !isExpired(token) && userId && current.token === token &&
      current.user?.id === userId && current.user?.role === role && hasPermission("inventory.manage", role));
  }
  return useQuery({
    queryKey: [...qk.admin, userId, role, "inventory", "list", params],
    enabled: enabled && isCurrentSession(),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!token || !isCurrentSession()) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      signal.throwIfAborted();
      const data = await getAdminInventory(params, signal, token);
      signal.throwIfAborted();
      if (!isCurrentSession()) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}
