import { api } from "@/shared/api/client";
import type { InventoryParams, InventoryResponse } from "./types";

export async function getAdminInventory(params: InventoryParams, signal: AbortSignal, authToken: string) {
  const { data } = await api.get<InventoryResponse[]>("/api/admin/inventory", {
    params: { status: params.status, minQuantity: params.minQuantity, maxQuantity: params.maxQuantity },
    signal, meta: { authToken, noPublicRetry: true },
  });
  return data;
}
