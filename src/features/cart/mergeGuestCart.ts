import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { queryClient } from "@/shared/api/queryClient";
import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { addCartItem } from "./api";
import { useCartMerge } from "./cartMerge.store";
import { useGuestCart } from "./guestCart.store";
import type { CartResponse } from "./types";
import type { ID } from "@/shared/types/common";

function isCurrentSession(token: string, userId: ID): boolean {
  const session = useSession.getState();
  return session.token === token && session.user?.id === userId;
}

function isDefiniteRejection(error: unknown): boolean {
  return error instanceof ApiError &&
    (error.status === 400 || error.status === 404);
}

async function runMerge(
  token: string,
  userId: ID,
  onlyVariantId?: ID,
): Promise<void> {
  const items = useGuestCart.getState().items.filter(
    (item) => !onlyVariantId || item.variantId === onlyVariantId,
  );
  if (items.length === 0) return;

  const cartKey = [...qk.cart, userId];
  const rejected: string[] = [];
  const uncertain: string[] = [];
  let transferred = 0;

  useCartMerge.getState().begin();

  try {
    for (const item of items) {
      if (!isCurrentSession(token, userId)) break;

      const name = item.snapshot.name;
      const mergeState = useCartMerge.getState();

      if (
        mergeState.attempts.some(
          (attempt) => attempt.variantId === item.variantId,
        )
      ) {
        uncertain.push(name);
        continue;
      }

      mergeState.mark({
        userId,
        variantId: item.variantId,
        name,
        quantity: item.quantity,
      });

      try {
        const cart = await addCartItem(
          {
            productVariantId: item.variantId,
            quantity: item.quantity,
          },
          token,
        );

        if (!isCurrentSession(token, userId)) break;

        await queryClient.cancelQueries({
          queryKey: cartKey,
          exact: true,
        });
        if (!isCurrentSession(token, userId)) break;

        queryClient.setQueryData<CartResponse>(cartKey, cart);

        useGuestCart.getState().remove(item.variantId);
        useCartMerge.getState().resolve(userId, item.variantId);
        transferred += 1;
      } catch (error) {
        if (!isCurrentSession(token, userId)) break;

        if (isDefiniteRejection(error)) {
          useCartMerge.getState().resolve(userId, item.variantId);
          rejected.push(name);
          continue;
        }

        uncertain.push(name);
        break;
      }
    }

    if (isCurrentSession(token, userId)) {
      if (transferred > 0) {
        toast.success(`Đã chuyển ${transferred} sản phẩm vào giỏ tài khoản.`);
      }

      if (rejected.length > 0) {
        toast.error(
          `Chưa chuyển được: ${rejected.join(", ")}. Sản phẩm vẫn được lưu trên thiết bị.`,
        );
      }

      if (uncertain.length > 0) {
        toast.warning(
          `Chưa rõ kết quả chuyển: ${uncertain.join(", ")}. Hãy kiểm tra giỏ tài khoản trước khi thử lại.`,
        );
        await queryClient.invalidateQueries({
          queryKey: cartKey,
          exact: true,
        });
      }
    }
  } finally {
    useCartMerge.getState().end();
  }
}

let running:
  | { token: string; promise: Promise<void> }
  | null = null;

export function startGuestCartMerge(
  token: string,
  userId: ID,
  onlyVariantId?: ID,
): Promise<void> {
  if (running?.token === token) return running.promise;

  if (running) {
    return running.promise.then(() => {
      if (isCurrentSession(token, userId)) {
        return startGuestCartMerge(token, userId, onlyVariantId);
      }
    });
  }

  const promise = runMerge(token, userId, onlyVariantId).finally(() => {
    if (running?.token === token) running = null;
  });

  running = { token, promise };
  return promise;
}
