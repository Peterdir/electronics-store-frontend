import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminCoupons, saveAdminCoupon, toggleAdminCoupon } from "./api";
import type { CouponRequest } from "./types";

export interface CouponsSession {
  userId: string;
  role: Role;
  token: string;
}

export function useCouponsSession(): CouponsSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentCouponsSession(snapshot: CouponsSession, write = false): boolean {
  const current = useSession.getState();
  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission(write ? "coupon.manage" : "coupon.view", snapshot.role);
}

function couponsKey(snapshot: CouponsSession) {
  return [...qk.admin, snapshot.userId, snapshot.role, "coupons"];
}

export function useAdminCoupons(snapshot: CouponsSession) {
  return useQuery({
    queryKey: [...couponsKey(snapshot), "list"],
    enabled: isCurrentCouponsSession(snapshot),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isCurrentCouponsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      const data = await getAdminCoupons(signal, snapshot.token);
      signal.throwIfAborted();
      if (!isCurrentCouponsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}

export type CouponAction =
  | { kind: "save"; id?: string; payload: CouponRequest }
  | { kind: "toggle"; id: string };

export function isCouponResultUncertain(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
}

export function useCouponAction(snapshot: CouponsSession) {
  const client = useQueryClient();
  const queryKey = couponsKey(snapshot);
  const mutationKey = [...queryKey, "write"];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (action: CouponAction) => {
      if (!isCurrentCouponsSession(snapshot, true)) throw new ApiError(403, "Phiên hoặc quyền quản lý coupon đã thay đổi.");
      if (client.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Coupon đang được cập nhật. Vui lòng chờ.");
      const result = action.kind === "toggle"
        ? await toggleAdminCoupon(action.id, snapshot.token)
        : await saveAdminCoupon(action.payload, snapshot.token, action.id);
      if (!isCurrentCouponsSession(snapshot, true)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSettled: async () => {
      if (!isCurrentCouponsSession(snapshot)) return;
      await client.cancelQueries({ queryKey });
      if (!isCurrentCouponsSession(snapshot)) return;
      await client.invalidateQueries({ queryKey, refetchType: "none" });
    },
  });

  async function refresh() {
    if (!isCurrentCouponsSession(snapshot)) return;
    await client.refetchQueries({ queryKey, type: "active" }, { throwOnError: true });
  }

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0, refresh };
}
