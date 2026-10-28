import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { addCartItem, clearServerCart, getCart, removeCartItem, updateCartItem } from "./api";
import { isExpired } from "@/shared/auth/jwt";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartItemResponse, CartResponse } from "./types";
import type { ID } from "@/shared/types/common";


export function useServerCart() {
    const token = useSession((state) => state.token);
    const userId = useSession((state) => state.user?.id);

    return useQuery({
        queryKey: [...qk.cart, userId],
        queryFn: ({ signal }) => getCart(signal),
        enabled: Boolean(token && userId && !isExpired(token)),
        retry:false,
    });
}

export function useAddCartItem() {
    const queryClient = useQueryClient();
    const userId = useSession((state) => state.user?.id);

    return useMutation({
        mutationFn: addCartItem,
        retry: false,

        onSuccess: async (cart) => {
            if (!userId || useSession.getState().user?.id !== userId) return;

            const cartKey = [...qk.cart, userId];

            await queryClient.cancelQueries({ queryKey: cartKey });
            queryClient.setQueryData(cartKey, cart);
        },
    })
}

function recalculate(
    cart: CartResponse,
    items: CartItemResponse[],
): CartResponse {
    return {
        ...cart,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
}

export function useUpdateCartItem() {
    const queryClient = useQueryClient();
    const userId = useSession((state) => state.user?.id);
    const key = [...qk.cart, userId];

    return useMutation({
        mutationFn: ({ id, quantity }: { id: ID; quantity: number }) => updateCartItem(id, quantity),
        retry: false,

        onMutate: async ({ id, quantity }) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<CartResponse>(key);

            queryClient.setQueryData<CartResponse>(key, (cart) => {
                if (!cart) return cart;

                const items = cart.items.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            quantity,
                            subtotal: item.unitPrice * quantity,
                            hasSufficientStock: quantity <= item.availableStock,
                        }
                        : item,
                );

                return recalculate(cart, items);
            });

            return previous;
        },

        onError: (_error, _variables, previous) => {
            if (userId === useSession.getState().user?.id && previous) {
                queryClient.setQueryData(key, previous);
            }
        },

        onSuccess: (cart) => {
            if (userId === useSession.getState().user?.id) {
                queryClient.setQueryData(key, cart);
            }
        },
    });
}

export function useRemoveCartItem() {
    const queryClient = useQueryClient();
    const userId = useSession((state) => state.user?.id);
    const key = [...qk.cart, userId];

    return useMutation({
        mutationFn: removeCartItem,
        retry: false,

        onMutate: async (id: ID) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<CartResponse>(key);

            queryClient.setQueryData<CartResponse>(key, (cart) =>
                cart
                ? recalculate(
                    cart,
                    cart.items.filter((item) => item.id !== id),
                )
                : cart,
            );

            return previous;
        },

        onError: (_error, _id, previous) => {
            if (userId === useSession.getState().user?.id && previous) {
                queryClient.setQueryData(key, previous);
            }
        },

        onSuccess: (cart) => {
            if (userId === useSession.getState().user?.id) {
                queryClient.setQueryData(key, cart);
            }
        },
    });
}

export function useClearServerCart() {
    const queryClient = useQueryClient();
    const userId = useSession((state) => state.user?.id);
    const key = [...qk.cart, userId];

    return useMutation({
        mutationFn: clearServerCart,
        retry: false,

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<CartResponse>(key);

            queryClient.setQueryData<CartResponse>(key, (cart) =>
                cart ? { ...cart, items: [], totalItems: 0, totalPrice: 0 } : cart,
            );

            return previous;
        },

        onError: (_error, _variables, previous) => {
            if (userId === useSession.getState().user?.id && previous) {
                queryClient.setQueryData(key, previous);
            }
        },

        onSuccess: async () => {
            if (userId === useSession.getState().user?.id) {
                await queryClient.invalidateQueries({ queryKey: key });
            }
        },
    });
}