import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { mutateAdminProductImages } from "./api";
import { isCurrentProductSession, useProductSession, type ProductSession } from "./queries";
import type { ProductImageAction } from "./productImages";

export function useAdminProductImages(id: string) {
  const session = useProductSession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "products", "images", id];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async ({ action, session: snapshot }: { action: ProductImageAction; session: ProductSession }) => {
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      if (queryClient.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Ảnh sản phẩm đang được xử lý. Vui lòng chờ.");
      const result = await mutateAdminProductImages(id, action, snapshot.token);
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSuccess: async (_result, { session: snapshot }) => {
      if (!isCurrentProductSession(snapshot)) return;
      const keys = [
        [...qk.admin, snapshot.userId, snapshot.role, "products"],
        qk.products, qk.cart, qk.wishlist,
      ];
      await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      if (!isCurrentProductSession(snapshot)) return;
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey, refetchType: "none" })));
    },
  });
  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}
