import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import type { CartResponse } from "./types";

export interface CartSession {
  userId: ID;
  token: string;
}

export const useCartWriteState = create<{
  busyUsers: ReadonlySet<ID>;
}>(() => ({
  busyUsers: new Set(),
}));

export function isCurrentCartSession({ userId, token }: CartSession): boolean {
  const current = useSession.getState();
  return current.user?.id === userId && current.token === token && !isExpired(token);
}

export function assertCartSession(session: CartSession): void {
  if (!isCurrentCartSession(session)) {
    throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
  }
}

export async function withCartWrite<T>(
  session: CartSession,
  task: () => Promise<T>,
): Promise<T> {
  assertCartSession(session);
  const { userId } = session;
  const { busyUsers } = useCartWriteState.getState();
  if (busyUsers.has(userId)) {
    throw new Error("Giỏ hàng đang được cập nhật. Vui lòng chờ.");
  }
  useCartWriteState.setState({ busyUsers: new Set(busyUsers).add(userId) });
  try {
    return await task();
  } finally {
    useCartWriteState.setState((state) => {
      const busyUsers = new Set(state.busyUsers);
      busyUsers.delete(userId);
      return { busyUsers };
    });
  }
}

export async function cacheServerCart(
  queryClient: QueryClient,
  session: CartSession,
  cart: CartResponse,
): Promise<void> {
  assertCartSession(session);
  const queryKey = [...qk.cart, session.userId];
  await queryClient.cancelQueries({ queryKey, exact: true });
  assertCartSession(session);
  queryClient.setQueryData(queryKey, cart);
  void queryClient.invalidateQueries({
    queryKey: [...qk.cart, "checkout-validation", session.userId],
    exact: true,
    refetchType: "none",
  });
}
