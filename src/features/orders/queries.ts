import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { useCartMerge } from "@/features/cart/cartMerge.store";
import {
  assertCartSession,
  cacheServerCart,
  isCurrentCartSession,
  withCartWrite,
  type CartSession,
} from "@/features/cart/cartWrite";
import { getVnpayRedirectUrl } from "@/features/payment/redirect";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { buyAgainOrder, cancelOrder, getOrderDetail, getOrders, payOrder } from "./api";
import type { GetOrdersParams } from "./types";
import type { ID } from "@/shared/types/common";
import { toast } from "sonner";
import type { CancelOrderValues } from "./schemas";

export function useGetOrders(
  params: GetOrdersParams,
  enabled = true,
) {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.orders, userId, "list", params],

    enabled: Boolean(
      enabled &&
      userId &&
      token &&
      !isExpired(token),
    ),

    retry: false,

    queryFn: async ({ signal }) => {
      function assertCurrentSession() {
        const current = useSession.getState();

        if (
          !userId ||
          !token ||
          isExpired(token) ||
          current.user?.id !== userId ||
          current.token !== token
        ) {
          throw new ApiError(
            401,
            "Phiên đăng nhập đã thay đổi.",
          );
        }
      }

      assertCurrentSession();

      if (!token) {
        throw new ApiError(401, "Vui lòng đăng nhập.");
      }

      const result = await getOrders(params, signal, token);

      assertCurrentSession();

      return result;
    },
  });
}

export function isCurrentOrdersSession(userId: ID, token: string) {
  const current = useSession.getState();

  return current.user?.id === userId &&
    current.token === token &&
    !isExpired(token);
}

function assertOrdersSession(userId: ID, token: string) {
  if (!isCurrentOrdersSession(userId, token)) {
    throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
  }
}

function invalidateOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: ID,
  orderId: ID,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [...qk.orders, userId, "detail", orderId], exact: true }),
    queryClient.invalidateQueries({ queryKey: [...qk.orders, userId, "list"] }),
  ]);
}

export function useOrderDetail(orderId: ID | undefined) {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.orders, userId, "detail", orderId],
    enabled: Boolean(orderId && userId && token && !isExpired(token)),
    retry: false,

    queryFn: async ({ signal }) => {
      if (!orderId || !userId || !token) {
        throw new ApiError(400, "Thiếu mã đơn hoặc phiên đăng nhập.");
      }

      assertOrdersSession(userId, token);

      try {
        const detail = await getOrderDetail(orderId, signal, token);
        assertOrdersSession(userId, token);
        return detail;
      } catch (error) {
        if (!signal.aborted && error instanceof ApiError && error.status === 404) {
          assertOrdersSession(userId, token);
          void queryClient.invalidateQueries({
            queryKey: [...qk.orders, userId, "list"],
          });
        }

        throw error;
      }
    },
  });
}

export function useCancelOrder(orderId: ID) {
  const queryClient = useQueryClient();
  const mutationKey = [...qk.orders, "cancel", orderId];
  const pendingCount = useIsMutating({ mutationKey, exact: true });

  function invalidateStock(userId: ID) {
    void queryClient.invalidateQueries({ queryKey: qk.products });
    void queryClient.invalidateQueries({ queryKey: [...qk.cart, userId] });
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,

    mutationFn: ({ userId, token, payload }: {
      userId: ID;
      token: string;
      payload: CancelOrderValues;
    }) => {
      assertOrdersSession(userId, token);
      return cancelOrder(orderId, payload, token);
    },

    onSuccess: async (detail, { userId, token }) => {
      if (!isCurrentOrdersSession(userId, token)) return;

      const detailKey = [...qk.orders, userId, "detail", orderId];
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true });

      if (!isCurrentOrdersSession(userId, token)) return;

      queryClient.setQueryData(detailKey, detail);
      void queryClient.invalidateQueries({
        queryKey: [...qk.orders, userId, "list"],
      });
      invalidateStock(userId);
      toast.success(detail.message ?? "Đã hủy đơn hàng.");
    },

    onError: async (error, { userId, token }) => {
      if (
        !isCurrentOrdersSession(userId, token) ||
        !(error instanceof ApiError) ||
        error.fieldErrors?.reason ||
        !([0, 400, 403, 404, 409].includes(error.status) || error.status >= 500)
      ) return;

      const detailKey = [...qk.orders, userId, "detail", orderId];
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true });

      if (!isCurrentOrdersSession(userId, token)) return;

      const latest = await queryClient.fetchQuery({
        queryKey: detailKey,
        retry: false,
        staleTime: 0,
        networkMode: "always",
        queryFn: async ({ signal }) => {
          assertOrdersSession(userId, token);
          const detail = await getOrderDetail(orderId, signal, token);
          assertOrdersSession(userId, token);
          return detail;
        },
      }).catch(() => undefined);

      if (!isCurrentOrdersSession(userId, token)) return;

      void queryClient.invalidateQueries({
        queryKey: [...qk.orders, userId, "list"],
      });
      if (!latest) return;

      if (latest.orderStatus === "CANCELLED") {
        invalidateStock(userId);
        toast.success("Đơn hàng đã được hủy.");
      } else if (!latest.canCancel) {
        toast.error(error.message);
      }
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending || pendingCount > 0,
  };
}

export function usePayOrder(orderId: ID) {
  const queryClient = useQueryClient();
  const mutationKey = [...qk.orders, "pay", orderId];
  const pendingCount = useIsMutating({ mutationKey, exact: true });

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,

    mutationFn: async ({ userId, token }: { userId: ID; token: string }) => {
      assertOrdersSession(userId, token);
      const payment = await payOrder(orderId, token);
      assertOrdersSession(userId, token);

      if (payment?.orderId !== orderId) {
        throw new Error("Đường dẫn thanh toán không khớp với đơn hàng.");
      }

      return getVnpayRedirectUrl(payment);
    },

    onError: async (error, { userId, token }) => {
      if (
        !isCurrentOrdersSession(userId, token) ||
        !(error instanceof ApiError) ||
        ![400, 403, 404, 409].includes(error.status)
      ) return;

      await invalidateOrderQueries(queryClient, userId, orderId);
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending || pendingCount > 0,
  };
}

const useUncertainBuyAgain = create<{ orders: ReadonlySet<string> }>(() => ({
  orders: new Set(),
}));

export function useBuyAgainOrder(orderId: ID) {
  const queryClient = useQueryClient();
  const currentUserId = useSession((state) => state.user?.id);
  const needsRetryConfirmation = useUncertainBuyAgain((state) =>
    Boolean(currentUserId && state.orders.has(`${currentUserId}:${orderId}`)),
  );

  const mutation = useMutation({
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: (session: CartSession & { retryConfirmed?: boolean }) => withCartWrite(session, async () => {
      const { userId, token } = session;
      const orderKey = `${userId}:${orderId}`;
      if (useUncertainBuyAgain.getState().orders.has(orderKey) && !session.retryConfirmed) {
        throw new Error("Hãy kiểm tra giỏ hàng và xác nhận trước khi mua lại lần nữa.");
      }

      const merge = useCartMerge.getState();
      if (merge.isMerging || merge.attempts.some((attempt) => attempt.userId === userId)) {
        throw new Error("Vui lòng hoàn tất đồng bộ và đối chiếu giỏ hàng trước khi mua lại.");
      }

      await queryClient.cancelQueries({ queryKey: [...qk.cart, userId], exact: true });
      assertCartSession(session);

      let result;
      try {
        result = await buyAgainOrder(orderId, token);
      } catch (error) {
        if (isCurrentCartSession(session) &&
            error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
          useUncertainBuyAgain.setState((state) => ({
            orders: new Set(state.orders).add(orderKey),
          }));
          void queryClient.invalidateQueries({ queryKey: [...qk.cart, userId], exact: true });
        }
        throw error;
      }

      await cacheServerCart(queryClient, session, result.cart);
      useUncertainBuyAgain.setState((state) => {
        const orders = new Set(state.orders);
        orders.delete(orderKey);
        return { orders };
      });
      return result;
    }),
    onError: async (error, session) => {
      if (isCurrentCartSession(session) && error instanceof ApiError &&
          [400, 403, 404, 409].includes(error.status)) {
        await invalidateOrderQueries(queryClient, session.userId, orderId);
      }
    },
  });
  return { ...mutation, needsRetryConfirmation };
}

export function useOrderAfterPayment(orderId: ID | undefined) {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.orders, userId, "after-payment", orderId],
    enabled: Boolean(orderId && userId && token && !isExpired(token)),
    retry: false,
    retryOnMount: false,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always",

    queryFn: async ({ signal }) => {
      if (!orderId || !userId || !token) {
        throw new ApiError(401, "Thiếu mã đơn hoặc phiên đăng nhập.");
      }

      assertOrdersSession(userId, token);
      const detail = await getOrderDetail(orderId, signal, token);
      signal.throwIfAborted();
      assertOrdersSession(userId, token);

      if (detail?.id !== orderId) {
        throw new ApiError(0, "Máy chủ trả về sai mã đơn hàng.");
      }

      void invalidateOrderQueries(queryClient, userId, orderId);
      return detail.id;
    },
  });
}
