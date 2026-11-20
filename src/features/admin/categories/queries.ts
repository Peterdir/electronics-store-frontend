import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId } from "@/shared/types/common";
import type { Role } from "@/shared/types/enums";
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from "./api";
import type { CategoryFormValues } from "./schemas";

export interface CategorySession {
  userId: string;
  role: Role;
  token: string;
}

export function isCurrentCategorySession(session: CategorySession): boolean {
  const current = useSession.getState();
  return Boolean(
    !isExpired(session.token) && current.token === session.token &&
    current.user?.id === session.userId && current.user?.role === session.role &&
    hasPermission("category.manage", session.role),
  );
}

function assertCategorySession(session: CategorySession) {
  if (!hasPermission("category.manage", session.role)) {
    throw new ApiError(403, "Bạn không có quyền quản lý danh mục.");
  }
  if (!isCurrentCategorySession(session)) {
    throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
  }
}

export function useCategorySession(): CategorySession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function useAdminCategories() {
  const session = useCategorySession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "categories", "list"],
    enabled: Boolean(session && isCurrentCategorySession(session)),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!session) throw new ApiError(401, "Vui lòng đăng nhập lại.");
      assertCategorySession(session);
      const data = await getAdminCategories(signal, session.token);
      signal.throwIfAborted();
      assertCategorySession(session);
      return data;
    },
  });
}

export function useCategoryWritesPending(): boolean {
  const session = useCategorySession();
  return useIsMutating({
    mutationKey: [...qk.admin, session?.userId, session?.role, "categories", "actions"],
  }) > 0;
}

type CategoryAction =
  | { kind: "create"; values: CategoryFormValues }
  | { kind: "update"; id: string; values: CategoryFormValues }
  | { kind: "delete"; id: string };

export type CategoryMutationVariables = CategoryAction & { session: CategorySession };

export function isCategoryResultUncertain(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}

export function useCategoryMutation() {
  const session = useCategorySession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "categories", "actions"];
  const pendingCount = useIsMutating({ mutationKey });

  async function refreshRelated(snapshot: CategorySession) {
    if (!isCurrentCategorySession(snapshot)) return;
    const prefix = [...qk.admin, snapshot.userId, snapshot.role];
    const keys = [
      [...prefix, "categories"], [...prefix, "products"],
      qk.categories, qk.products, qk.brands,
    ];

    await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
    if (!isCurrentCategorySession(snapshot)) return;
    for (const queryKey of keys) {
      void queryClient.invalidateQueries({ queryKey }).catch(() => undefined);
    }
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async (variables: CategoryMutationVariables) => {
      assertCategorySession(variables.session);
      if (queryClient.isMutating({ mutationKey }) > 1) {
        throw new ApiError(409, "Danh mục đang được cập nhật. Vui lòng chờ.", "CATEGORY_ACTION_BUSY");
      }
      if (variables.kind !== "create" && !isPositiveLongId(variables.id)) {
        throw new ApiError(400, "Mã danh mục không hợp lệ.");
      }
      const token = variables.session.token;
      const result = variables.kind === "create"
        ? await createAdminCategory(variables.values, token)
        : variables.kind === "update"
          ? await updateAdminCategory(variables.id, variables.values, token)
          : await deleteAdminCategory(variables.id, token);
      assertCategorySession(variables.session);
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
      if (!isCurrentCategorySession(variables.session)) return;
      toast.success(variables.kind === "delete" ? "Đã xóa danh mục." : "Đã lưu danh mục.", { duration: 2000 });
    },
    onError: async (error, variables) => {
      if (isCategoryResultUncertain(error) || (error instanceof ApiError && error.status === 404)) {
        await refreshRelated(variables.session);
      }
    },
  });

  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}
