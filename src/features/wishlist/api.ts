import { api } from "@/shared/api/client";
import type { ID, MessageResponse } from "@/shared/types/common";
import type { WishlistItemResponse } from "./types";

export async function getWishlist(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<WishlistItemResponse[]>("/api/wishlists", {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function setProductWishlist(productId: ID, desired: boolean, authToken: string) {
  const { data } = await api.request<MessageResponse>({
    url: `/api/wishlists/${productId}`,
    method: desired ? "POST" : "DELETE",
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}
