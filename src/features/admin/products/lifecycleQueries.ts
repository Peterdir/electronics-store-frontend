import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { hasPermission } from "@/shared/auth/permissions";
import { mutateAdminProductLifecycle } from "./api";
import { isCurrentProductSession, useProductSession, type ProductSession } from "./queries";
import type { ProductLifecycleAction } from "./types";

export function useAdminProductLifecycle(id: string) {
  const session = useProductSession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "products", "lifecycle", id];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async ({ action, session: snapshot }: { action: ProductLifecycleAction; session: ProductSession }) => {
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      const permission = action.kind === "status" ? "product.changeStatus"
        : action.kind === "reactivate" ? "product.reactivateVariant" : "product.deactivateVariant";
      if (!hasPermission(permission, snapshot.role)) throw new ApiError(403, "Bạn không có quyền thực hiện thao tác này.");
      if (queryClient.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Trạng thái sản phẩm đang được xử lý. Vui lòng chờ.");
      const result = await mutateAdminProductLifecycle(id, action, snapshot.token);
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSuccess: async (_result, { session: snapshot }) => {
      if (!isCurrentProductSession(snapshot)) return;
      const prefix = [...qk.admin, snapshot.userId, snapshot.role];
      const keys = [[...prefix, "products"], [...prefix, "inventory"], [...prefix, "dashboard"], qk.products, qk.cart, qk.wishlist];
      await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      if (!isCurrentProductSession(snapshot)) return;
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey, refetchType: "none" })));
    },
  });
  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}
