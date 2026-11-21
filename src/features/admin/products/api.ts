import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { AdminProductListResponse, GetAdminProductsParams } from "./types";

export async function getAdminProducts(
  params: GetAdminProductsParams,
  signal: AbortSignal,
  authToken: string,
) {
  const { data } = await api.get<BackendPage<AdminProductListResponse>>("/api/admin/products", {
    params,
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return normalizePage(data);
}
