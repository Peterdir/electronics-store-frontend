import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { validateDateRange } from "./dateRange";
import type { DashboardOverview, DateRange } from "./types";

export async function getAdminDashboard(range: DateRange, signal: AbortSignal, authToken: string) {
  const error = validateDateRange(range);
  if (error) throw new ApiError(400, error);

  const { data } = await api.get<DashboardOverview>("/api/admin/dashboard", {
    params: { startDate: range.startDate, endDate: range.endDate },
    signal,
    meta: { authToken, noPublicRetry: true },
  });

  return data;
}
