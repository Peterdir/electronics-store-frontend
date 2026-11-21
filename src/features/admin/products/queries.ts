import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { isPositiveLongId } from "@/shared/types/common";
import { getAdminBrands } from "../brands/api";
import { getAdminCategories } from "../categories/api";
import { createAdminProduct, getAdminProductDetail, getAdminProducts, updateAdminProduct } from "./api";
import type { EditProductFormValues } from "./editProduct";
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

async function runForSession<T>(
  session: ProductSession | null,
  action: (token: string) => Promise<T>,
): Promise<T> {
  if (!isCurrentProductSession(session)) throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng đăng nhập lại.");
  const result = await action(session.token);
  if (!isCurrentProductSession(session)) throw new ApiError(401, "Phiên quản trị đã thay đổi. Vui lòng đăng nhập lại.");
  return result;
}

export function isProductWriteUncertain(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status === 408 || error.status >= 500);
}

export const isProductCreateUncertain = isProductWriteUncertain;

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
      return runForSession(snapshot, async (token) => {
        if (queryClient.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Một sản phẩm đang được tạo. Vui lòng chờ.");
        return createAdminProduct(values, token);
      });
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
  return runForSession(session, async (token) => {
    signal.throwIfAborted();
    const data = await read(signal, token);
    signal.throwIfAborted();
    return data;
  });
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

export function useAdminProductDetail(id: string | undefined) {
  const session = useProductSession();
  return useQuery({
    queryKey: [...qk.admin, session?.userId, session?.role, "products", "detail", id],
    enabled: isPositiveLongId(id) && isCurrentProductSession(session),
    retry: false,
    queryFn: ({ signal }) => readForSession(session, signal, (requestSignal, token) => {
      if (!isPositiveLongId(id)) throw new ApiError(400, "Mã sản phẩm không hợp lệ.");
      return getAdminProductDetail(id, requestSignal, token);
    }),
  });
}

export function useUpdateAdminProduct(id: string) {
  const session = useProductSession();
  const queryClient = useQueryClient();
  const mutationKey = [...qk.admin, session?.userId, session?.role, "products", "update", id];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    retry: false,
    networkMode: "always",
    gcTime: 0,
    mutationFn: async ({ values, session: snapshot }: { values: EditProductFormValues; session: ProductSession }) => {
      return runForSession(snapshot, async (token) => {
        if (queryClient.isMutating({ mutationKey }) > 1) throw new ApiError(409, "Sản phẩm này đang được lưu. Vui lòng chờ.");
        return updateAdminProduct(id, values, token);
      });
    },
    onSuccess: async (_result, { session: snapshot }) => {
      if (!isCurrentProductSession(snapshot)) return;
      const prefix = [...qk.admin, snapshot.userId, snapshot.role];
      const keys = [[...prefix, "products"], [...prefix, "inventory"], qk.products, qk.cart, qk.wishlist];
      await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      if (!isCurrentProductSession(snapshot)) return;
      for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey, refetchType: "none" }).catch(() => undefined);
      toast.success("Đã lưu thông tin sản phẩm.", { duration: 2000 });
    },
  });
  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
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
