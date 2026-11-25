import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { isPositiveLongId } from "@/shared/types/common";
import type { AdjustStockRequest, InventoryHistoryResponse, InventoryParams, InventoryResponse } from "./types";

export async function getAdminInventory(params: InventoryParams, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<InventoryResponse[]>("/api/admin/inventory", {
    params: { status: params.status, minQuantity: params.minQuantity, maxQuantity: params.maxQuantity },
    signal, meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function adjustAdminStock(id: string, request: AdjustStockRequest, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã kho không hợp lệ.");
  if (!Number.isSafeInteger(request.quantity) || request.quantity <= 0 || !["ADD", "DEDUCT"].includes(request.action)) {
    throw new ApiError(400, "Hành động hoặc số lượng điều chỉnh không hợp lệ.");
  }
  const { data } = await api.post<InventoryResponse>(`/api/admin/inventory/${id}/adjust`, request, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function getAdminInventoryHistory(id: string, signal: AbortSignal, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã kho không hợp lệ.");
  const { data } = await api.get<InventoryHistoryResponse[]>(`/api/admin/inventory/${id}/history`, {
    signal, meta: { authToken, noPublicRetry: true },
  });
  return data;
}
