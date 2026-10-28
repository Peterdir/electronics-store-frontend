import { useGuestCart } from "./guestCart.store";
import type { AddGuestCartResult, GuestCartItem } from "./guestCart.types";
import { useAddCartItem, useClearServerCart, useRemoveCartItem, useServerCart, useUpdateCartItem } from "./queries";
import { useSession } from "@/shared/auth/session.store";
import { isExpired } from "@/shared/auth/jwt";
import { ApiError } from "@/shared/api/errors";

export function useCart() {
  const setGuestQuantity = useGuestCart((state) => state.setQuantity);
  const removeGuestItem = useGuestCart((state) => state.remove);
  const clearGuestCart = useGuestCart((state) => state.clear);

  const updateServerItem = useUpdateCartItem();
  const removeServerItem = useRemoveCartItem();
  const clearServerCart = useClearServerCart();

  const token = useSession((state) => state.token);
  const guestItems = useGuestCart((state) => state.items);
  const addGuestItem = useGuestCart((state) => state.add);

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

  async function updateQuantity(id: string, quantity: number): Promise<void> {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Số lượng phải là số nguyên lớn hơn 0.");
    }

    if (!token) {
      if (!setGuestQuantity(id, quantity)) {
        throw new Error("Số lượng vượt quá tồn kho đã ghi nhận.");
      }
      return;
    }

    if (isExpired(token)) {
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
    }

    await updateServerItem.mutateAsync({ id, quantity });
  }

  async function removeItem(id: string): Promise<void> {
    if (!token) {
      removeGuestItem(id);
      return;
    }

    if (isExpired(token)) {
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
    }

    await removeServerItem.mutateAsync(id);
  }

  async function clearCart(): Promise<void> {
    if (!token) {
      clearGuestCart();
      return;
    }

    if (isExpired(token)) {
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
    }

    await clearServerCart.mutateAsync();
  }

  if (token) {
    return {
      mode: "user" as const,
      items: serverCart.data?.items ?? [],
      totalItems: serverCart.data?.totalItems ?? 0,
      totalPrice: serverCart.data?.totalPrice ?? 0,
      isLoading: serverCart.isLoading,
      isAdding: addServerItem.isPending,
      error: isExpired(token)
        ? new ApiError(401, "Phiên đăng nhập đã hết hạn.")
        : serverCart.error,
      refetch: serverCart.refetch,
      addItem,
      isChanging:
        updateServerItem.isPending ||
        removeServerItem.isPending ||
        clearServerCart.isPending,
      updateQuantity,
      removeItem,
      clearCart,
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
    isChanging: false,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}