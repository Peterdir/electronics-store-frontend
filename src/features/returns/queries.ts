import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateOrderQueries, isCurrentOrdersSession } from "@/features/orders/queries";
import type { OrderDetailUserResponse } from "@/features/orders/types";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId, type ID } from "@/shared/types/common";
import { ReturnStatus } from "@/shared/types/enums";
import { createReturnRequest } from "./api";
import { getReturnEligibility } from "./eligibility";
import type { ReturnRequestValues } from "./schemas";

export function useCreateReturnRequest(orderId: ID, orderItemId: ID) {
  const userId = useSession((state) => state.user?.id);
  const token = useSession((state) => state.token);
  const queryClient = useQueryClient();
  const mutationKey = [...qk.returns, userId, orderItemId];
  const sending = useIsMutating({ mutationKey, exact: true }) > 0;

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (input: { userId: ID; token: string; values: ReturnRequestValues }) => {
      if (!isCurrentOrdersSession(input.userId, input.token)) {
        throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
      }

      const order = queryClient.getQueryData<OrderDetailUserResponse>([
        ...qk.orders, input.userId, "detail", orderId,
      ]);
      const item = order?.items.find((item) => item.id === orderItemId);
      if (!order || order.id !== orderId || !item) {
        throw new ApiError(404, "Không tìm thấy sản phẩm trong đơn hàng này.");
      }
      if (item.returnStatus) throw new ApiError(409, "Sản phẩm này đã có yêu cầu trả hàng.");
      const eligibility = getReturnEligibility(order);
      if (eligibility.error) throw new ApiError(400, eligibility.error);

      const request = await createReturnRequest(
        { ...input.values, orderItemId },
        input.token,
      );
      if (!isCurrentOrdersSession(input.userId, input.token)) {
        throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
      }
      if (!isPositiveLongId(request?.id) || request.orderId !== orderId ||
          request.orderItemId !== orderItemId || request.status !== ReturnStatus.PENDING) {
        throw new ApiError(0, "Máy chủ trả về xác nhận không hợp lệ.");
      }
      return request;
    },
    onSuccess: (_request, input) => {
      if (isCurrentOrdersSession(input.userId, input.token)) {
        void invalidateOrderQueries(queryClient, input.userId, orderId);
      }
    },
  });

  async function submit(values: ReturnRequestValues) {
    if (!userId || !token || !isCurrentOrdersSession(userId, token)) {
      throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
    }
    if (queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    await mutation.mutateAsync({ userId, token, values });
  }

  const sameSession = mutation.variables?.userId === userId && mutation.variables?.token === token;
  return {
    submit,
    sending,
    receipt: sameSession ? mutation.data : undefined,
    error: sameSession && mutation.error instanceof ApiError ? mutation.error : undefined,
  };
}
