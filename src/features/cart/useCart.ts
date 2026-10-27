import { useGuestCart } from "./guestCart.store";
import type { AddGuestCartResult, GuestCartItem } from "./guestCart.types";
import { useAddCartItem, useServerCart } from "./queries";
import { useSession } from "@/shared/auth/session.store";
import { isExpired } from "@/shared/auth/jwt";
import { ApiError } from "@/shared/api/errors";

export function useCart() {
  const token = useSession((state) => state.token);
  const guestItems = useGuestCart((state) => state.items);
  const addGuestItem = useGuestCart((state) => state.add);

  // React hooks luôn được gọi, kể cả khi đang ở chế độ guest.
  // useServerCart tự ngừng request nhờ `enabled: false`.
  const serverCart = useServerCart();
  const addServerItem = useAddCartItem();

  async function addItem(
    item: GuestCartItem,
  ): Promise<AddGuestCartResult> {
    if (!token) {
      return addGuestItem(item);
    }

    if (isExpired(token)) {
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
    }

    await addServerItem.mutateAsync({
      productVariantId: item.variantId,
      quantity: item.quantity,
    });

    return { ok: true };
  }

  if (token) {
    return {
      mode: "user" as const,
      items: serverCart.data?.items ?? [],
      totalItems: serverCart.data?.totalItems ?? 0,
      totalPrice: serverCart.data?.totalPrice ?? 0,
      isLoading: serverCart.isLoading,
      isAdding: addServerItem.isPending,
      error: serverCart.error,
      refetch: serverCart.refetch,
      addItem,
    };
  }

  return {
    mode: "guest" as const,
    items: guestItems,
    totalItems: guestItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
    totalPrice: guestItems.reduce(
      (sum, item) => sum + item.snapshot.price * item.quantity,
      0,
    ),
    isLoading: false,
    isAdding: false,
    error: null,
    refetch: undefined,
    addItem,
  };
}