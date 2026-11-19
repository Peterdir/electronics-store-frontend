import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { ID } from "@/shared/types/common";
import type { GetAdminOrdersParams, OrderDetailAdminResponse, OrderListAdminResponse } from "./types";

export async function getAdminOrderDetail(id: ID, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<OrderDetailAdminResponse>(`/api/admin/orders/${id}`, {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function getAdminOrders(
  params: GetAdminOrdersParams,
  signal: AbortSignal,
  authToken: string,
) {
  const { data } = await api.get<BackendPage<OrderListAdminResponse>>("/api/admin/orders", {
    params,
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return normalizePage(data);
}
