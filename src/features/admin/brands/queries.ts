import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId } from "@/shared/types/common";
import type { Role } from "@/shared/types/enums";
import { createAdminBrand, deleteAdminBrand, getAdminBrands, updateAdminBrand } from "./api";
import type { BrandFormValues, CreateBrandValues } from "./schemas";

export interface BrandSession {
  userId: string;
  role: Role;
  token: string;
}

export function isCurrentBrandSession(session: BrandSession): boolean {
  const current = useSession.getState();
  return Boolean(
    !isExpired(session.token) && current.token === session.token &&
    current.user?.id === session.userId && current.user?.role === session.role &&
    hasPermission("brand.manage", session.role),
  );
}

function assertBrandSession(session: BrandSession) {
  if (!hasPermission("brand.manage", session.role)) {
    throw new ApiError(403, "Bạn không có quyền quản lý thương hiệu.");
  }
  if (!isCurrentBrandSession(session)) {
    throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
  }
}

export function useBrandSession(): BrandSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function useAdminBrands() {
  const session = useBrandSession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "brands", "list"],
    enabled: Boolean(session && isCurrentBrandSession(session)),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!session) throw new ApiError(401, "Vui lòng đăng nhập lại.");
      assertBrandSession(session);
      const data = await getAdminBrands(signal, session.token);
      signal.throwIfAborted();
      assertBrandSession(session);
      return data;
    },
  });
}

export function useBrandWritesPending(): boolean {
  const session = useBrandSession();
  return useIsMutating({
    mutationKey: [...qk.admin, session?.userId, session?.role, "brands", "actions"],
  }) > 0;
}

type BrandAction =
  | { kind: "create"; values: CreateBrandValues }
  | { kind: "update"; id: string; values: BrandFormValues }
  | { kind: "delete"; id: string };

export type BrandMutationVariables = BrandAction & { session: BrandSession };

export function isBrandResultUncertain(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}

export function useBrandMutation() {
  const session = useBrandSession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "brands", "actions"];
  const pendingCount = useIsMutating({ mutationKey });

  async function refreshRelated(snapshot: BrandSession) {
    if (!isCurrentBrandSession(snapshot)) return;
    const prefix = [...qk.admin, snapshot.userId, snapshot.role];
    const keys = [
      [...prefix, "brands"], [...prefix, "products"],
      qk.brands, qk.products,
    ];
    await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
    if (!isCurrentBrandSession(snapshot)) return;
    for (const queryKey of keys) {
      void queryClient.invalidateQueries({ queryKey }).catch(() => undefined);
    }
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (variables: BrandMutationVariables) => {
      assertBrandSession(variables.session);
      if (queryClient.isMutating({ mutationKey }) > 1) {
        throw new ApiError(409, "Thương hiệu đang được cập nhật. Vui lòng chờ.", "BRAND_ACTION_BUSY");
      }
      if (variables.kind !== "create" && !isPositiveLongId(variables.id)) {
        throw new ApiError(400, "Mã thương hiệu không hợp lệ.");
      }
      const token = variables.session.token;
      const result = variables.kind === "create"
        ? await createAdminBrand(variables.values, token)
        : variables.kind === "update"
          ? await updateAdminBrand(variables.id, variables.values, token)
          : await deleteAdminBrand(variables.id, token);
      assertBrandSession(variables.session);
      if (variables.kind !== "delete" && (
        !result || !isPositiveLongId(result.id) ||
        (variables.kind === "update" && result.id !== variables.id)
      )) {
        throw new ApiError(0, "Chưa xác nhận được kết quả lưu. Hãy kiểm tra lại danh sách.");
      }
      return result;
    },
    onSuccess: async (_data, variables) => {
      await refreshRelated(variables.session);
      if (!isCurrentBrandSession(variables.session)) return;
      toast.success(variables.kind === "delete" ? "Đã xóa thương hiệu." : "Đã lưu thương hiệu.", { duration: 2000 });
    },
    onError: async (error, variables) => {
      if (isBrandResultUncertain(error) || (error instanceof ApiError && error.status === 404)) {
        await refreshRelated(variables.session);
      }
    },
  });

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}
