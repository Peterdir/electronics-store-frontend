import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { ID } from "@/shared/types/common";
import type { CancelAdminOrderRequest, GetAdminOrdersParams, OrderDetailAdminResponse, OrderListAdminResponse } from "./types";
import type { UpdateOrderStatusValues } from "./schemas";

export async function cancelAdminOrder(id: ID, payload: CancelAdminOrderRequest, authToken: string) {
  const { data } = await api.put<OrderDetailAdminResponse>(`/api/admin/orders/${id}/cancel`, payload, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateAdminOrderStatus(id: ID, payload: UpdateOrderStatusValues, authToken: string) {
  const { data } = await api.put<OrderDetailAdminResponse>(`/api/admin/orders/${id}/status`, payload, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

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
