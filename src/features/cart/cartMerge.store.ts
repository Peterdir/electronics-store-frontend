import type { ID } from "@/shared/types/common";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MergeAttempt {
    userId: ID;
    variantId: ID;
    name: string;
    quantity: number;
}

function isMergeAttempt(value: unknown): value is MergeAttempt {
    if (typeof value !== "object" || value === null) return false;
    const attempt = value as Partial<MergeAttempt>;

    return typeof attempt.userId === "string" &&
        typeof attempt.variantId === "string" &&
        typeof attempt.name === "string" &&
        Number.isSafeInteger(attempt.quantity) &&
        (attempt.quantity ?? 0) > 0;
}

interface CartMergeState {
    isMerging: boolean;
    attempts: MergeAttempt[];
    begin: () => void;
    end: () => void;
    mark: (attempt: MergeAttempt) => void;
    resolve: (userId: ID, variantId: ID) => void;
    dropVariant: (variantId: ID) => void;
    clearAttempts: () => void;
}

export const useCartMerge = create<CartMergeState>()(
    persist(
        (set) => ({
            isMerging: false,
            attempts: [],

            begin: () => set({ isMerging: true }),
            end: () => set({ isMerging: false }),

            mark: (attempt) => 
                set((state) => ({
                    attempts: [
                        ...state.attempts.filter(
                            (item) =>
                                item.userId !== attempt.userId ||
                                item.variantId !== attempt.variantId,
                        ),
                        attempt,
                    ],
                })),
            
            resolve: (userId, variantId) =>
                set((state) => ({
                    attempts: state.attempts.filter(
                        (item) =>
                            item.userId !== userId ||
                            item.variantId !== variantId,
                    )
                })),
            dropVariant: (variantId) =>
                set((state) => ({
                    attempts: state.attempts.filter(
                        (item) => item.variantId !== variantId,
                    ),
                })),
            clearAttempts: () => set({ attempts: [] }),
        }),
        {
            name: "ec.cartMerge",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ attempts: state.attempts }),
            merge: (saved, current) => {
                const persisted = saved as { attempts?: unknown } | null;
                const attempts = persisted?.attempts;

                return {
                    ...current,
                    attempts: Array.isArray(attempts)
                        ? attempts.filter(isMergeAttempt)
                        : [],
                };
            },
        },
    ),
);
