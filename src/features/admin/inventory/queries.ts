import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { isPositiveLongId } from "@/shared/types/common";
import { adjustAdminStock, getAdminInventory, getAdminInventoryHistory } from "./api";
import type { AdjustStockRequest, InventoryParams } from "./types";

export interface InventorySession { userId: string; role: Role; token: string }

export function useInventorySession(): InventorySession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentInventorySession(snapshot: InventorySession | null): snapshot is InventorySession {
  const current = useSession.getState();
  return Boolean(snapshot && !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role && hasPermission("inventory.manage", snapshot.role));
}

async function readInventorySession<T>(snapshot: InventorySession, signal: AbortSignal, read: () => Promise<T>) {
  if (!isCurrentInventorySession(snapshot))
    throw new ApiError(401, "Phiên quản trị đã thay đổi.");
  signal.throwIfAborted();
  const data = await read();
  signal.throwIfAborted();
  if (!isCurrentInventorySession(snapshot))
    throw new ApiError(401, "Phiên quản trị đã thay đổi.");
  return data;
}

export function useInventoryHistory(id: string, snapshot: InventorySession) {
  return useQuery({
    queryKey: [...qk.admin, snapshot.userId, snapshot.role, "inventory", "history", id],
    enabled: isPositiveLongId(id) && isCurrentInventorySession(snapshot),
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }: { signal: AbortSignal }) => {
      return readInventorySession(snapshot, signal, () =>
        getAdminInventoryHistory(id, signal, snapshot.token),
      );
    },
  });
}

export function isStockResultUncertain(error: unknown) {
  return error instanceof ApiError && (error.status === 0 || error.status === 408 || error.status === 404 || error.status >= 500);
}

export function useAdjustStock(id: string, snapshot: InventorySession) {
  const client = useQueryClient();
  const prefix = [...qk.admin, snapshot.userId, snapshot.role];
  const mutationKey = [...prefix, "inventory", "adjust", id];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (request: AdjustStockRequest) => {
      if (!isCurrentInventorySession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      if (client.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Kho này đang được điều chỉnh. Vui lòng chờ.");
      const data = await adjustAdminStock(id, request, snapshot.token);
      if (!isCurrentInventorySession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
    onSettled: async (data, error) => {
      if (!data && !isStockResultUncertain(error)) return;
      if (!isCurrentInventorySession(snapshot)) return;
      const keys = [[...prefix, "inventory"], [...prefix, "products"], [...prefix, "dashboard"], qk.products, qk.cart, qk.wishlist];
      await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })));
      if (!isCurrentInventorySession(snapshot)) return;
      await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey, refetchType: "none" })));
    },
  });

  async function reconcile() {
    const items = await client.query({
      queryKey: [...prefix, "inventory", "list", {}],
      staleTime: 0,
      retry: false,
      queryFn: ({ signal }) => {
        return readInventorySession(snapshot, signal, () =>
          getAdminInventory({}, signal, snapshot.token),
        );
      },
    });
    const item = items.find((row) => row.id === id);
    if (!item) throw new ApiError(404, "Bản ghi kho không còn trong danh sách. Hãy tải lại trang.");
    await client.query({
      queryKey: [...prefix, "inventory", "history", id], staleTime: 0, retry: false,
      queryFn: ({ signal }) => {
        return readInventorySession(snapshot, signal, () =>
          getAdminInventoryHistory(id, signal, snapshot.token),
        );
      },
    });
    if (!isCurrentInventorySession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
    await client.refetchQueries({ queryKey: [...prefix, "inventory", "list"], type: "active" });
    if (!isCurrentInventorySession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
    for (const queryKey of [[...prefix, "products"], [...prefix, "dashboard"], qk.products, qk.cart, qk.wishlist]) {
      void client.refetchQueries({ queryKey, type: "active" });
    }
    return item;
  }
  return {
    ...mutation,
    isPending: mutation.isPending || pendingCount > 0,
    reconcile,
  };
}

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
