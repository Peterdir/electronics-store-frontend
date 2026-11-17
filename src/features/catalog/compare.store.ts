import type { ID } from "@/shared/types/common";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CompareState {
  compareIds: ID[];
  categoryName: string | null;
  setCategory: (categoryName: string) => void;
  add: (id: ID, categoryName: string) => boolean;
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
      categoryName: null,

      setCategory: (categoryName) => {
        if (get().categoryName === categoryName) return;
        set({ compareIds: [], categoryName });
      },

      add: (id, categoryName) => {
        const state = get();
        const ids = state.categoryName === categoryName ? state.compareIds : [];
        if (ids.includes(id) || ids.length >= 4) return false;

        set({ compareIds: [...ids, id], categoryName });
        return true;
      },

      remove: (id) => {
        set((state) => ({
          compareIds: state.compareIds.filter((current) => current !== id),
        }));
      },

      clear: () => set({ compareIds: [], categoryName: null }),
    }),
    {
      name: "ec.compare",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        compareIds: state.compareIds,
        categoryName: state.categoryName,
      }),
      merge: (saved, current) => {
        const persisted = saved as Partial<CompareState> | undefined;
        const categoryName = typeof persisted?.categoryName === "string"
          && persisted.categoryName.trim() ? persisted.categoryName : null;

        return {
          ...current,
          categoryName,
          // Old selections have no category, so they cannot safely be restored.
          compareIds: categoryName ? normalizeIds(persisted?.compareIds) : [],
        };
      },
    },
  ),
);
