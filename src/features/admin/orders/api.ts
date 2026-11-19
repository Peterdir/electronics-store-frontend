import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { GetAdminOrdersParams, OrderListAdminResponse } from "./types";

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
