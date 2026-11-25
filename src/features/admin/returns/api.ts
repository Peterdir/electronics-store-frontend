import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import { isPositiveLongId } from "@/shared/types/common";
import { processReturnSchema, type ProcessReturnRequest } from "./schemas";
import type { AdminReturnRequest, ReturnFilters } from "./types";

export async function getAdminReturns(filters: ReturnFilters, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<BackendPage<AdminReturnRequest>>("/api/admin/return-requests", {
    params: { status: filters.status, page: filters.page - 1, size: filters.size },
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return normalizePage(data);
}

export async function processAdminReturn(id: string, payload: ProcessReturnRequest, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã yêu cầu không hợp lệ.");
  const request = processReturnSchema.parse(payload);
  const { data } = await api.put<AdminReturnRequest>(`/api/admin/return-requests/${id}/process`, request, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}
