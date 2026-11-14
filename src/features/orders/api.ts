import { api } from "@/shared/api/client";
import {
  normalizePage,
  type BackendPage,
} from "@/shared/api/pagination";
import type {
  BuyAgainResponse,
  GetOrdersParams,
  OrderDetailUserResponse,
  OrderListUserResponse,
  OrderPaymentResponse,
} from "./types";
import type { ID } from "@/shared/types/common";
import type { CancelOrderValues } from "./schemas";

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

export async function getOrderDetail(
  id: ID,
  signal: AbortSignal,
  authToken: string,
) {
  const { data } = await api.get<OrderDetailUserResponse>(`/api/orders/${id}`, {
    signal,
    meta: { authToken, noPublicRetry: true },
  });

  return data;
}

export async function cancelOrder(
  id: ID,
  payload: CancelOrderValues,
  authToken: string,
) {
  const { data } = await api.put<OrderDetailUserResponse>(
    `/api/orders/${id}/cancel`,
    payload,
    { meta: { authToken, noPublicRetry: true } },
  );

  return data;
}

export async function payOrder(id: ID, authToken: string) {
  const { data } = await api.post<OrderPaymentResponse>(
    `/api/orders/${id}/pay`,
    undefined,
    { meta: { authToken, noPublicRetry: true } },
  );

  return data;
}

export async function buyAgainOrder(id: ID, authToken: string) {
  const { data } = await api.post<BuyAgainResponse>(
    `/api/orders/${id}/buy-again`,
    undefined,
    {
      meta: {
        authToken,
        noPublicRetry: true,
      },
    },
  );

  return data;
}
