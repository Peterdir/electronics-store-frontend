import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { AdminProductListResponse, GetAdminProductsParams } from "./types";
import { buildCreateProductFormData } from "./buildCreateProductRequest";
import type { ProductFormValues } from "./schemas";

export async function createAdminProduct(values: ProductFormValues, authToken: string): Promise<string> {
  const { data } = await api.post<string>("/api/admin/products", buildCreateProductFormData(values), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

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
