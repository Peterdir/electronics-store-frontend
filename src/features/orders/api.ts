import { api } from "@/shared/api/client";
import {
  normalizePage,
  type BackendPage,
} from "@/shared/api/pagination";
import type {
  GetOrdersParams,
  OrderListUserResponse,
} from "./types";

export async function getOrders(
  params: GetOrdersParams,
  signal: AbortSignal,
  authToken: string,
) {
  const response = await api.get<
    BackendPage<OrderListUserResponse>
  >("/api/orders", {
    params,
    signal,
    meta: {
      authToken,
      noPublicRetry: true,
    },
  });

  return normalizePage(response.data);
}