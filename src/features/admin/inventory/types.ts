import type { ID } from "@/shared/types/common";

export const inventoryStatuses = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;
export type InventoryStatus = typeof inventoryStatuses[number];

export interface InventoryResponse {
  id: ID;
  productId: ID | null;
  productName: string | null;
  variantId: ID | null;
  sku: string | null;
  quantity: number | null;
  status: InventoryStatus;
  updatedAt: string | null;
}

export interface InventoryParams {
  status?: InventoryStatus;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface AdjustStockRequest {
  quantity: number;
  action: "ADD" | "DEDUCT";
  reason?: string;
}

export interface InventoryHistoryResponse {
  id: ID;
  action: "ADD" | "DEDUCT";
  quantityChanged: number;
  finalStock: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: string | null;
}
