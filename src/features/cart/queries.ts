import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { addCartItem, clearServerCart, getCart, removeCartItem, updateCartItem, validateCartForCheckout } from "./api";
import { useCartMerge } from "./cartMerge.store";
import { assertCartSession, cacheServerCart, isCurrentCartSession, withCartWrite, type CartSession } from "./cartWrite";
import type { AddToCartRequest, CartItemResponse, CartResponse } from "./types";

export function useServerCart() {
  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id);

  return useQuery({
    queryKey: [...qk.cart, userId],
    enabled: Boolean(token && userId && !isExpired(token)),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!userId || !token) throw new ApiError(401, "Vui lòng đăng nhập.");
      const session = { userId, token };
      assertCartSession(session);
      const cart = await getCart(signal, session.token);
      assertCartSession(session);
      return cart;
    },
  });
}

function useCartMutation<Payload>(
  write: (payload: Payload, token: string) => Promise<CartResponse | undefined>,
  optimistic?: (cart: CartResponse, payload: Payload) => CartResponse,
) {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async (payload: Payload) => {
      if (!userId || !token) throw new ApiError(401, "Vui lòng đăng nhập.");
      const session: CartSession = { userId, token };
      return withCartWrite(session, async () => {
        if (useCartMerge.getState().isMerging) {
          throw new Error("Giỏ hàng đang được đồng bộ. Vui lòng chờ.");
        }

        const queryKey = [...qk.cart, session.userId];
        await queryClient.cancelQueries({ queryKey, exact: true });
        assertCartSession(session);
        const previous = queryClient.getQueryData<CartResponse>(queryKey);
        if (previous && optimistic) {
          queryClient.setQueryData(queryKey, optimistic(previous, payload));
        }

        let cart: CartResponse | undefined;
        try {
          cart = await write(payload, session.token);
        } catch (error) {
          if (previous && optimistic && isCurrentCartSession(session)) {
            await cacheServerCart(queryClient, session, previous);
          }
          throw error;
        }

        if (cart) {
          await cacheServerCart(queryClient, session, cart);
        } else if (isCurrentCartSession(session)) {
          await queryClient.invalidateQueries({ queryKey, exact: true });
        }
      });
    },
  });
}

function recalculate(cart: CartResponse, items: CartItemResponse[]): CartResponse {
  return {
    ...cart,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

export function useAddCartItem() {
  return useCartMutation((payload: AddToCartRequest, token) => addCartItem(payload, token));
}

export function useUpdateCartItem() {
  return useCartMutation(
    ({ id, quantity }: { id: ID; quantity: number }, token) => updateCartItem(id, quantity, token),
    (cart, { id, quantity }) => recalculate(cart, cart.items.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity,
            subtotal: item.unitPrice * quantity,
            hasSufficientStock: quantity <= item.availableStock,
          }
        : item,
    )),
  );
}

export function useRemoveCartItem() {
  return useCartMutation(
    (id: ID, token) => removeCartItem(id, token),
    (cart, id) => recalculate(cart, cart.items.filter((item) => item.id !== id)),
  );
}

export function useClearServerCart() {
  return useCartMutation(
    async (_payload: void, token) => {
      await clearServerCart(token);
      return undefined;
    },
    (cart) => recalculate(cart, []),
  );
}

export function useCheckoutCartValidation(userId: ID) {
  return useQuery({
    queryKey: [...qk.cart, "checkout-validation", userId],
    queryFn: ({ signal }) => validateCartForCheckout(signal),
    retry: false,
  });
}
