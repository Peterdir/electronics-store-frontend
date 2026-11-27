import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import { isPositiveLongId } from "@/shared/types/common";
import { userActionSchema } from "./schemas";
import type { AdminUser, UserAction, UserFilters } from "./types";

function requireUserId(id: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã người dùng không hợp lệ.");
}

export async function getAdminUsers(filters: UserFilters, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<BackendPage<AdminUser>>("/api/admin/users", {
    params: { keyword: filters.keyword, page: filters.page - 1, size: filters.size },
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return normalizePage(data);
}

export async function getAdminUser(id: string, signal: AbortSignal, authToken: string) {
  requireUserId(id);
  const { data } = await api.get<AdminUser>(`/api/admin/users/${id}`, {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateAdminUser(id: string, input: UserAction, authToken: string) {
  requireUserId(id);
  const action = userActionSchema.parse(input);
  const { data } = await api.put<string>(`/api/admin/users/${id}/${action.kind}`, undefined, {
    params: { [action.kind]: action.value },
    responseType: "text",
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}
