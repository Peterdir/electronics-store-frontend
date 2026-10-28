import type { Attributes } from "@/shared/types/common";

export interface CartRow {
  id: string;
  productId: string | null;
  name: string;
  sku: string;
  imageUrl: string | null;
  attributes: Attributes | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stock: number;
  issue: boolean;
}