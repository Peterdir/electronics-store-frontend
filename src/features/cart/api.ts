import { api } from "@/shared/api/client";
import type { AddToCartRequest, CartCheckoutValidationResponse, CartResponse } from "./types";
import type { ID, MessageResponse } from "@/shared/types/common";


export async function getCart(
    signal?: AbortSignal,
    authToken?: string,
): Promise<CartResponse> {
    const response = await api.get<CartResponse>("/api/cart", {
        signal,
        meta: { authToken, noPublicRetry: true },
    });

    return response.data;
}

export async function addCartItem(
    payload: AddToCartRequest,
    authToken?: string,
): Promise<CartResponse> {
    const response = await api.post<CartResponse>(
        "/api/cart/items",
        payload,
        authToken
            ? { meta: {authToken, noPublicRetry: true } }
            : undefined
    );

    return response.data;
}

export async function updateCartItem(
  cartItemId: ID,
  quantity: number,
  authToken: string,
): Promise<CartResponse> {
    const response = await api.put<CartResponse>(
        `/api/cart/items/${cartItemId}`,
        { quantity },
        { meta: { authToken, noPublicRetry: true } },
    );

    return response.data;
}

export async function removeCartItem(cartItemId: ID, authToken: string): Promise<CartResponse> {
    const response = await api.delete<CartResponse>(
        `/api/cart/items/${cartItemId}`,
        { meta: { authToken, noPublicRetry: true } },
    );

    return response.data;
}

export async function clearServerCart(authToken: string): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>("/api/cart", {
        meta: { authToken, noPublicRetry: true },
    });

    return response.data;
}

export async function validateCartForCheckout(
  signal?: AbortSignal,
): Promise<CartCheckoutValidationResponse> {
  const response = await api.post<CartCheckoutValidationResponse>(
    "/api/cart/validate-checkout",
    undefined,
    { signal, meta: { noPublicRetry: true } },
  );

  return response.data;
}
