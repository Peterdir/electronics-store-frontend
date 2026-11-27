import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getRevenueReport } from "./api";
import { createReportRangeSchema } from "./schemas";
import type { ReportRange } from "./types";

export interface ReportsSession {
  userId: string;
  role: Role;
  token: string;
}

export function useReportsSession(): ReportsSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentReportsSession(snapshot: ReportsSession): boolean {
  const current = useSession.getState();
  return !isExpired(snapshot.token) && current.token === snapshot.token &&
    current.user?.id === snapshot.userId && current.user?.role === snapshot.role &&
    hasPermission("report.view", snapshot.role);
}

export function useRevenueReport(range: ReportRange | null, snapshot: ReportsSession) {
  return useQuery({
    queryKey: [...qk.admin, snapshot.userId, snapshot.role, "reports", "preview", range],
    enabled: range !== null && createReportRangeSchema().safeParse(range).success &&
      isCurrentReportsSession(snapshot),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!range || !isCurrentReportsSession(snapshot)) {
        throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      }
      const data = await getRevenueReport(range, signal, snapshot.token);
      signal.throwIfAborted();
      if (!isCurrentReportsSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return data;
    },
  });
}
