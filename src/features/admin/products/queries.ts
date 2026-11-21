import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import type { Role } from "@/shared/types/enums";
import { getAdminBrands } from "../brands/api";
import { getAdminCategories } from "../categories/api";
import { getAdminProducts } from "./api";
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
