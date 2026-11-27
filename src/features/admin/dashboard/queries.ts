import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminDashboard } from "./api";
import { validateDateRange } from "./dateRange";
import type { DateRange } from "./types";

export interface DashboardSession {
  userId: string;
  role: Role;
  token: string;
}

export function useDashboardSession(): DashboardSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentDashboardSession(snapshot: DashboardSession): boolean {
  const current = useSession.getState();
  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission("dashboard.view", snapshot.role);
}

export function useAdminDashboard(range: DateRange, snapshot: DashboardSession) {
  return useQuery({
    queryKey: [...qk.admin, snapshot.userId, snapshot.role, "dashboard", range],
    enabled: isCurrentDashboardSession(snapshot) && validateDateRange(range) === null,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isCurrentDashboardSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      const data = await getAdminDashboard(range, signal, snapshot.token);
      signal.throwIfAborted();
      if (!isCurrentDashboardSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}
