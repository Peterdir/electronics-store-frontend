import type { ID } from "@/shared/types/common";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CompareState {
  compareIds: ID[];
  add: (id: ID) => boolean;
  remove: (id: ID) => void;
  clear: () => void;
}

function normalizeIds(value: unknown): ID[] {
  if (!Array.isArray(value)) return [];

  const ids = value.filter(
    (id): id is ID =>
      typeof id === "string" && /^[1-9]\d*$/.test(id),
  );

  return [...new Set(ids)].slice(0, 4);
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      compareIds: [],

      add: (id) => {
        const ids = get().compareIds;
        if (ids.includes(id) || ids.length >= 4) return false;

        set({ compareIds: [...ids, id] });
        return true;
      },

      remove: (id) => {
        set((state) => ({
          compareIds: state.compareIds.filter((current) => current !== id),
        }));
      },

      clear: () => set({ compareIds: [] }),
    }),
    {
      name: "ec.compare",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ compareIds: state.compareIds }),
      merge: (saved, current) => ({
        ...current,
        compareIds: normalizeIds(
          (saved as Partial<CompareState> | undefined)?.compareIds,
        ),
      }),
    },
  ),
);