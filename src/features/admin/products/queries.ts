import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminBrands } from "../brands/api";
import { getAdminCategories } from "../categories/api";
import { createAdminProduct, getAdminProducts } from "./api";
import type { ProductFormValues } from "./schemas";
import type { GetAdminProductsParams } from "./types";

export interface ProductSession {
  userId: string;
  role: Role;
  token: string;
}

export function useProductSession(): ProductSession | null {
  const userId = useSession((state) => state.user?.id);
  const role = useSession((state) => state.user?.role);
  const token = useSession((state) => state.token);
  return userId && role && token ? { userId, role, token } : null;
}

export function isCurrentProductSession(session: ProductSession | null): session is ProductSession {
  const current = useSession.getState();
  return Boolean(
    session && !isExpired(session.token) && current.token === session.token &&
    current.user?.id === session.userId && current.user?.role === session.role &&
    hasPermission("product.write", session.role),
  );
}

export function isProductCreateUncertain(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status === 408 || error.status >= 500);
}

export function useCreateAdminProduct() {
  const session = useProductSession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "products", "create"];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async ({ values, session: snapshot }: { values: ProductFormValues; session: ProductSession }) => {
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng đăng nhập lại.");
      if (queryClient.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Một sản phẩm đang được tạo. Vui lòng chờ.");
      const result = await createAdminProduct(values, snapshot.token);
      if (!isCurrentProductSession(snapshot)) throw new ApiError(401, "Phiên quản trị đã thay đổi.");
      return result;
    },
    onSuccess: async (_result, { session: snapshot }) => {
      if (!isCurrentProductSession(snapshot)) return;
      const prefix = [...qk.admin, snapshot.userId, snapshot.role];
      const keys = [
        [...prefix, "products"], [...prefix, "inventory"],
        [...prefix, "categories"], [...prefix, "brands"],
        qk.products, qk.categories, qk.brands,
      ];
      await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      if (!isCurrentProductSession(snapshot)) return;
      for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey }).catch(() => undefined);
      toast.success("Đã tạo sản phẩm.", { duration: 2000 });
    },
  });
  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}

async function readForSession<T>(
  session: ProductSession | null,
  signal: AbortSignal,
  read: (signal: AbortSignal, token: string) => Promise<T>,
): Promise<T> {
  if (!isCurrentProductSession(session)) throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
  signal.throwIfAborted();
  const data = await read(signal, session.token);
  signal.throwIfAborted();
  if (!isCurrentProductSession(session)) throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng tải lại trang.");
  return data;
}

export function useAdminProducts(params: GetAdminProductsParams, enabled = true) {
  const session = useProductSession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "products", "list", params],
    enabled: enabled && isCurrentProductSession(session),
    retry: false,
    queryFn: ({ signal }) => readForSession(session, signal, (requestSignal, token) =>
      getAdminProducts(params, requestSignal, token)),
  });
}

export function useAdminProductCategories() {
  const session = useProductSession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "products", "filters", "categories"],
    enabled: isCurrentProductSession(session),
    retry: false,
    queryFn: ({ signal }) => readForSession(session, signal, getAdminCategories),
  });
}

export function useAdminProductBrands() {
  const session = useProductSession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "products", "filters", "brands"],
    enabled: isCurrentProductSession(session),
    retry: false,
    queryFn: ({ signal }) => readForSession(session, signal, getAdminBrands),
  });
}
