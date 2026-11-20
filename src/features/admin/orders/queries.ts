import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId } from "@/shared/types/common";
import type { OrderStatus, Role } from "@/shared/types/enums";
import { cancelAdminOrder, getAdminOrderDetail, getAdminOrders, updateAdminOrderStatus } from "./api";
import { canCancelAdminOrder, canUpdateFulfillmentStatus } from "./orderActions";
import {
  cancelAdminOrderSchema, updateOrderStatusSchema,
  type CancelAdminOrderValues, type UpdateOrderStatusValues,
} from "./schemas";
import type { GetAdminOrdersParams } from "./types";

export function isCurrentAdminOrdersSession(
  userId: string | undefined,
  role: Role | undefined,
  token: string | null,
): boolean {
  const current = useSession.getState();
  return Boolean(
    userId && token && !isExpired(token) &&
    current.user?.id === userId && current.user?.role === role &&
    current.token === token && hasPermission("order.view", current.user?.role),
  );
}

function assertCurrentSession(
  userId: string | undefined,
  role: Role | undefined,
  token: string | null,
): asserts token is string {
  if (!isCurrentAdminOrdersSession(userId, role, token)) {
    throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
  }
}

export function useAdminOrderDetail(orderId: string | undefined) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.admin, userId, role, "orders", "detail", orderId],
    enabled: Boolean(
      isPositiveLongId(orderId) && userId && token &&
      !isExpired(token) && hasPermission("order.view", role),
    ),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!isPositiveLongId(orderId)) throw new ApiError(400, "Mã đơn hàng không hợp lệ.");
      assertCurrentSession(userId, role, token);
      const result = await getAdminOrderDetail(orderId, signal, token);
      signal.throwIfAborted();
      assertCurrentSession(userId, role, token);
      return result;
    },
  });
}

interface AdminOrderActionSession {
  userId: string;
  role: Role;
  token: string;
  expectedStatus: OrderStatus;
}

export interface UpdateAdminOrderStatusVariables extends AdminOrderActionSession {
  payload: UpdateOrderStatusValues;
}

export interface CancelAdminOrderVariables extends AdminOrderActionSession {
  payload: CancelAdminOrderValues;
}

// Hai hành động dùng chung khóa để không vừa chuyển trạng thái vừa hủy cùng một đơn.
function useAdminOrderActionContext(orderId: string, action: "update-status" | "cancel") {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const actionKey = [...qk.admin, userId, role, "orders", "actions", orderId];
  const mutationKey = [...actionKey, action];
  const pendingCount = useIsMutating({ mutationKey: actionKey });

  function assertActionSession(session: AdminOrderActionSession) {
    assertCurrentSession(session.userId, session.role, session.token);
    const permission = action === "cancel" ? "order.cancel" : "order.updateStatus";
    if (!hasPermission(permission, session.role)) {
      throw new ApiError(403, "Bạn không có quyền thực hiện hành động này trên đơn hàng.");
    }
  }

  function assertNotBusy() {
    if (queryClient.isMutating({ mutationKey: actionKey }) > 1) {
      throw new ApiError(409, "Đơn hàng đang được cập nhật. Vui lòng chờ.", "ORDER_ACTION_BUSY");
    }
  }

  function detailKey(session: AdminOrderActionSession) {
    return [...qk.admin, session.userId, session.role, "orders", "detail", orderId];
  }

  async function reloadDetail(session: AdminOrderActionSession) {
    assertActionSession(session);
    const queryKey = detailKey(session);
    await queryClient.cancelQueries({ queryKey, exact: true });
    assertActionSession(session);
    return queryClient.fetchQuery({
      queryKey,
      retry: false,
      staleTime: 0,
      networkMode: "always",
      queryFn: async ({ signal }) => {
        assertActionSession(session);
        const latest = await getAdminOrderDetail(orderId, signal, session.token);
        signal.throwIfAborted();
        assertActionSession(session);
        if (latest.id !== orderId) throw new ApiError(0, "Máy chủ trả về sai mã đơn hàng.");
        return latest;
      },
    });
  }

  function invalidateRelated(session: AdminOrderActionSession) {
    const prefix = [...qk.admin, session.userId, session.role];
    for (const resource of ["orders", "dashboard", "reports"]) {
      void queryClient.invalidateQueries({ queryKey: [...prefix, resource] });
    }
    if (action === "cancel") {
      for (const resource of ["inventory", "products"]) {
        void queryClient.invalidateQueries({ queryKey: [...prefix, resource] });
      }
      void queryClient.invalidateQueries({ queryKey: qk.products });
    }
  }

  return {
    queryClient, mutationKey, pendingCount, assertActionSession, assertNotBusy,
    detailKey, reloadDetail, invalidateRelated,
  };
}

export function useUpdateAdminOrderStatus(orderId: string) {
  const {
    queryClient, mutationKey, pendingCount, assertActionSession, assertNotBusy,
    detailKey, reloadDetail, invalidateRelated,
  } = useAdminOrderActionContext(orderId, "update-status");

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (session: UpdateAdminOrderStatusVariables) => {
      assertActionSession(session);
      if (!isPositiveLongId(orderId)) throw new ApiError(400, "Mã đơn hàng không hợp lệ.");
      assertNotBusy();
      const payload = updateOrderStatusSchema.parse(session.payload);
      if (!canUpdateFulfillmentStatus(session.expectedStatus, payload.newStatus)) {
        throw new ApiError(400, "Chỉ được chuyển trạng thái xử lý/giao hàng theo từng bước.", "INVALID_FULFILLMENT_TRANSITION");
      }

      const latest = await reloadDetail(session);
      assertActionSession(session);
      if (latest.orderStatus !== session.expectedStatus) {
        throw new ApiError(409, "Trạng thái đơn đã thay đổi. Hãy đóng hộp thoại và chọn lại từ dữ liệu mới.");
      }
      const detail = await updateAdminOrderStatus(orderId, payload, session.token);
      assertActionSession(session);
      if (detail.id !== orderId) throw new ApiError(0, "Máy chủ trả về sai mã đơn hàng. Hãy tải lại dữ liệu.");
      return detail;
    },
    onSuccess: async (detail, session) => {
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      await queryClient.cancelQueries({ queryKey: detailKey(session), exact: true });
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      queryClient.setQueryData(detailKey(session), detail);
      invalidateRelated(session);
      toast.success("Đã cập nhật trạng thái đơn hàng.");
    },
    onError: async (error, session) => {
      if (
        !isPositiveLongId(orderId) || !(error instanceof ApiError) ||
        error.code === "ORDER_ACTION_BUSY" || error.code === "INVALID_FULFILLMENT_TRANSITION" ||
        !isCurrentAdminOrdersSession(session.userId, session.role, session.token)
      ) return;
      await reloadDetail(session).catch(() => undefined);
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      invalidateRelated(session);
    },
  });

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}

export function useCancelAdminOrder(orderId: string) {
  const {
    queryClient, mutationKey, pendingCount, assertActionSession, assertNotBusy,
    detailKey, reloadDetail, invalidateRelated,
  } = useAdminOrderActionContext(orderId, "cancel");

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (session: CancelAdminOrderVariables) => {
      assertActionSession(session);
      if (!isPositiveLongId(orderId)) throw new ApiError(400, "Mã đơn hàng không hợp lệ.");
      assertNotBusy();
      const payload = cancelAdminOrderSchema.parse(session.payload);
      if (!canCancelAdminOrder(session.expectedStatus)) {
        throw new ApiError(400, "Chỉ được hủy đơn chờ xác nhận hoặc đang xử lý.", "INVALID_CANCEL_STATUS");
      }

      const latest = await reloadDetail(session);
      assertActionSession(session);
      if (latest.orderStatus !== session.expectedStatus || !canCancelAdminOrder(latest.orderStatus)) {
        throw new ApiError(409, "Trạng thái đơn đã thay đổi. Hãy đóng hộp thoại và kiểm tra dữ liệu mới.");
      }
      const detail = await cancelAdminOrder(orderId, payload, session.token);
      assertActionSession(session);
      if (detail.id !== orderId || detail.orderStatus !== "CANCELLED") {
        throw new ApiError(0, "Chưa xác nhận được kết quả hủy đơn. Hãy tải lại dữ liệu.");
      }
      return detail;
    },
    onSuccess: async (detail, session) => {
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      await queryClient.cancelQueries({ queryKey: detailKey(session), exact: true });
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      queryClient.setQueryData(detailKey(session), detail);
      invalidateRelated(session);
      toast.success(detail.paymentStatus === "PENDING_REFUND"
        ? "Đã hủy đơn hàng. Thanh toán đang chờ hoàn tiền."
        : "Đã hủy đơn hàng.", { duration: 2000 });
    },
    onError: async (error, session) => {
      if (
        !isPositiveLongId(orderId) || !(error instanceof ApiError) ||
        error.code === "ORDER_ACTION_BUSY" || error.code === "INVALID_CANCEL_STATUS" ||
        !isCurrentAdminOrdersSession(session.userId, session.role, session.token)
      ) return;
      await reloadDetail(session).catch(() => undefined);
      if (!isCurrentAdminOrdersSession(session.userId, session.role, session.token)) return;
      invalidateRelated(session);
    },
  });

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}

export function useAdminOrders(params: GetAdminOrdersParams, enabled = true) {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);

  return useQuery({
    queryKey: [...qk.admin, userId, role, "orders", "list", params],
    enabled: Boolean(
      enabled && userId && token && !isExpired(token) && hasPermission("order.view", role),
    ),
    retry: false,
    queryFn: async ({ signal }) => {
      assertCurrentSession(userId, role, token);
      const result = await getAdminOrders(params, signal, token);
      signal.throwIfAborted();
      assertCurrentSession(userId, role, token);
      return result;
    },
  });
}
