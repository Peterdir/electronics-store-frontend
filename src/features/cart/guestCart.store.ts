import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AddGuestCartResult, GuestCartItem } from "./guestCart.types";
import { useCartMerge } from "./cartMerge.store";

interface GuestCartState {
  items: GuestCartItem[];
  add: (incoming: GuestCartItem) => AddGuestCartResult;
  setQuantity: (variantId: string, quantity: number) => boolean;
  remove: (variantId: string) => void;
  clear: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGuestCartItem(value: unknown): value is GuestCartItem {
  if (!isRecord(value) || !isRecord(value.snapshot)) return false;

  const snapshot = value.snapshot;
  const attributes = snapshot.attributes;

  return (
    typeof value.variantId === "string" &&
    /^[1-9]\d*$/.test(value.variantId) &&
    Number.isSafeInteger(value.quantity) &&
    (value.quantity as number) >= 1 &&
    typeof snapshot.productId === "string" &&
    /^[1-9]\d*$/.test(snapshot.productId) &&
    typeof snapshot.name === "string" &&
    typeof snapshot.sku === "string" &&
    typeof snapshot.price === "number" &&
    Number.isFinite(snapshot.price) &&
    snapshot.price >= 0 &&
    (snapshot.image === null || typeof snapshot.image === "string") &&
    (attributes === null ||
      (isRecord(attributes) &&
        Object.values(attributes).every(
          (v) =>
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean",
        ))) &&
    Number.isSafeInteger(snapshot.stock) &&
    (snapshot.stock as number) >= 0
  );
}

function normalizeItems(value: unknown): GuestCartItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: GuestCartItem[] = [];

  for (const raw of value) {
    if (!isGuestCartItem(raw)) continue;
    if (raw.quantity > raw.snapshot.stock) continue;
    if (seen.has(raw.variantId)) continue;

    seen.add(raw.variantId);
    items.push(raw);
  }

  return items;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (incoming) => {
        if (!isGuestCartItem(incoming)) {
          return { ok: false, reason: "invalid" };
        }

        const { variantId, quantity, snapshot } = incoming;

        if (snapshot.stock === 0) {
          return { ok: false, reason: "out-of-stock" };
        }

        const items = get().items;
        const existing = items.find((item) => item.variantId === variantId);
        const currentQuantity = existing?.quantity ?? 0;
        const nextQuantity = currentQuantity + quantity;

        if (nextQuantity > snapshot.stock) {
          return {
            ok: false,
            reason: "exceeds-stock",
            remaining: Math.max(0, snapshot.stock - currentQuantity),
          };
        }

        set({
          items: existing
            ? items.map((item) =>
                item.variantId === variantId
                  ? { ...item, quantity: nextQuantity, snapshot }
                  : item,
              )
            : [...items, incoming],
        });

        if (!existing) {
          useCartMerge.getState().dropVariant(variantId);
        }

        return { ok: true };
      },
      setQuantity: (variantId, quantity) => {
        const item = get().items.find((item) => item.variantId === variantId);

        if (!item ||
            !Number.isSafeInteger(quantity) ||
            quantity < 1 ||
            quantity > item.snapshot.stock
        ) {
          return false;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity }: item,
          ),
        }));

        return true;
      },

      remove: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
        useCartMerge.getState().dropVariant(variantId);
      },

      clear: () => {
        set({ items: [] });
        useCartMerge.getState().clearAttempts();
      },
    }),
    {
      name: "ec.guestCart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (saved, current) => {
        const persisted = isRecord(saved) ? saved : {};
        return { ...current, items: normalizeItems(persisted.items) };
      },
    },
  ),
);
