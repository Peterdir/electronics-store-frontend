import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminReturns, processAdminReturn } from "./api";
import type { ProcessReturnRequest } from "./schemas";
import type { ReturnFilters } from "./types";

export interface ReturnsSession { userId: string; role: Role; token: string }

export function useReturnsSession(): ReturnsSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentReturnsSession(snapshot: ReturnsSession, processing = false) {
  const current = useSession.getState();
  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission(processing ? "return.process" : "return.view", snapshot.role);
}

export function useAdminReturns(filters: ReturnFilters, snapshot: ReturnsSession) {
  return useQuery({
    queryKey: [...qk.admin, snapshot.userId, snapshot.role, "returns", "list", filters],
    enabled: isCurrentReturnsSession(snapshot),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isCurrentReturnsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      signal.throwIfAborted();
      const data = await getAdminReturns(filters, signal, snapshot.token);
      signal.throwIfAborted();
      if (!isCurrentReturnsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}

export function useProcessReturn(id: string, snapshot: ReturnsSession) {
  const client = useQueryClient();
  const prefix = [...qk.admin, snapshot.userId, snapshot.role];
  const mutationKey = [...prefix, "returns", "process", id];
  const relatedKeys = [
    ...["returns", "orders", "inventory", "products", "dashboard"].map((name) => [...prefix, name]),
    qk.returns, qk.orders, qk.products, qk.cart, qk.wishlist,
  ];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (payload: ProcessReturnRequest) => {
      if (!isCurrentReturnsSession(snapshot, true)) throw new ApiError(403, "Phiên hoặc quyền xử lý đã thay đổi.");
      if (client.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Yêu cầu này đang được xử lý.");
      const data = await processAdminReturn(id, payload, snapshot.token);
      if (!isCurrentReturnsSession(snapshot, true)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
    onSettled: async () => {
      if (!isCurrentReturnsSession(snapshot)) return;
      await Promise.all(relatedKeys.map((queryKey) => client.cancelQueries({ queryKey })));
      if (!isCurrentReturnsSession(snapshot)) return;
      await Promise.all(relatedKeys.map((queryKey) => client.invalidateQueries({ queryKey, refetchType: "none" })));
    },
  });

  async function refreshRelated() {
    if (!isCurrentReturnsSession(snapshot)) return;
    await Promise.all(relatedKeys.map((queryKey) => client.refetchQueries({ queryKey, type: "active" }, { throwOnError: true })));
  }

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0, refreshRelated };
}
