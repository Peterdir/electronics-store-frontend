import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { getAdminUser, getAdminUsers, updateAdminUser } from "./api";
import { canPerformUserAction, type UsersActor } from "./policy";
import type { AdminUser, UserAction, UserFilters } from "./types";

export interface UsersSession extends UsersActor {
  token: string;
}

export function useUsersSession(): UsersSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentUsersSession(snapshot: UsersSession): boolean {
  const current = useSession.getState();
  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission("user.view", snapshot.role);
}

function usersKey(snapshot: UsersSession) {
  return [...qk.admin, snapshot.userId, snapshot.role, "users"];
}

async function readInSession<T>(snapshot: UsersSession, signal: AbortSignal, read: () => Promise<T>) {
  if (!isCurrentUsersSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
  const data = await read();
  signal.throwIfAborted();
  if (!isCurrentUsersSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
  return data;
}

export function useAdminUsers(filters: UserFilters, snapshot: UsersSession) {
  return useQuery({
    queryKey: [...usersKey(snapshot), "list", filters],
    enabled: isCurrentUsersSession(snapshot),
    retry: false,
    queryFn: ({ signal }) => readInSession(snapshot, signal, () => getAdminUsers(filters, signal, snapshot.token)),
  });
}

export function useAdminUser(id: string, snapshot: UsersSession) {
  return useQuery({
    queryKey: [...usersKey(snapshot), "detail", id],
    enabled: isCurrentUsersSession(snapshot),
    retry: false,
    queryFn: ({ signal }) => readInSession(snapshot, signal, () => getAdminUser(id, signal, snapshot.token)),
  });
}

export function useUserAction(target: AdminUser, snapshot: UsersSession) {
  const client = useQueryClient();
  const queryKey = usersKey(snapshot);
  const mutationKey = [...queryKey, "write", target.id];
  const pending = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (action: UserAction) => {
      if (!isCurrentUsersSession(snapshot) || !canPerformUserAction(snapshot, target, action)) {
        throw new ApiError(403, "Không được phép thay đổi tài khoản này.");
      }
      if (client.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Tài khoản đang được cập nhật.");
      const result = await updateAdminUser(target.id, action, snapshot.token);
      if (!isCurrentUsersSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSettled: async () => {
      if (!isCurrentUsersSession(snapshot)) return;
      await client.cancelQueries({ queryKey });
      if (isCurrentUsersSession(snapshot)) await client.invalidateQueries({ queryKey, refetchType: "none" });
    },
  });

  async function refresh() {
    if (isCurrentUsersSession(snapshot)) {
      await client.refetchQueries({ queryKey, type: "active" }, { throwOnError: true });
    }
  }

  return { ...mutation, isPending: mutation.isPending || pending > 0, refresh };
}
