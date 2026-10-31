import type { ID } from "@/shared/types/common";

export interface BuyNowSnapshot {
  productId: ID;
  productName: string;
  sku: string;
  unitPrice: number;
  imageUrl: string | null;
  availableStock: number;
}

export type CheckoutEntry =
  | { kind: "cart"; startedUserId: ID | null }
  | {
      kind: "buyNow";
      startedUserId: ID | null;
      directItem: { productVariantId: ID; quantity: number };
      snapshot: BuyNowSnapshot;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readCheckoutEntry(
  search: string,
  state: unknown,
): CheckoutEntry | null {
  const source = new URLSearchParams(search).get("source");

  if (!isRecord(state) || !("startedUserId" in state)) return null;

  const startedUserId = state.startedUserId;
  if (
    startedUserId !== null &&
    (typeof startedUserId !== "string" || startedUserId.length === 0)
  ) {
    return null;
  }

  if (source === "cart") {
    return { kind: "cart", startedUserId };
  }

  if (source !== "buy-now") return null;

  const directItems = state.directItems;
  const snapshot = state.snapshot;

  if (!Array.isArray(directItems) || directItems.length !== 1) return null;

  const item: unknown = directItems[0];
  if (!isRecord(item) || !isRecord(snapshot)) return null;

  if (
    typeof item.productVariantId !== "string" ||
    item.productVariantId.length === 0 ||
    typeof item.quantity !== "number" ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 1 ||
    typeof snapshot.productId !== "string" ||
    typeof snapshot.productName !== "string" ||
    typeof snapshot.sku !== "string" ||
    typeof snapshot.unitPrice !== "number" ||
    !Number.isFinite(snapshot.unitPrice) ||
    snapshot.unitPrice < 0 ||
    (snapshot.imageUrl !== null &&
      typeof snapshot.imageUrl !== "string") ||
    typeof snapshot.availableStock !== "number" ||
    !Number.isSafeInteger(snapshot.availableStock) ||
    snapshot.availableStock < 0
  ) {
    return null;
  }

  return {
    kind: "buyNow",
    startedUserId,
    directItem: {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
    },
    snapshot: {
      productId: snapshot.productId,
      productName: snapshot.productName,
      sku: snapshot.sku,
      unitPrice: snapshot.unitPrice,
      imageUrl: snapshot.imageUrl,
      availableStock: snapshot.availableStock,
    },
  };
}