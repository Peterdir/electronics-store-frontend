import { api } from "@/shared/api/client";
import type { AddToCartRequest, CartResponse } from "./types";


export async function getCart(
    signal?: AbortSignal,
): Promise<CartResponse> {
    const response = await api.get<CartResponse>("/api/cart", { signal })

    return response.data;
}

export async function addCartItem(
    payload: AddToCartRequest,
): Promise<CartResponse> {
    const response = await api.post<CartResponse>(
        "/api/cart/items",
        payload,
    );

    return response.data;
}