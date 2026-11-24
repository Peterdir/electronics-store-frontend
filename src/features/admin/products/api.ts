import { api } from "@/shared/api/client";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";
import type { AdminProductDetailResponse, AdminProductListResponse, GetAdminProductsParams } from "./types";
import { isPositiveLongId } from "@/shared/types/common";
import { ApiError } from "@/shared/api/errors";
import { buildUpdateProductRequest, type EditProductFormValues } from "./editProduct";
import { buildCreateProductFormData } from "./buildCreateProductRequest";
import type { ProductFormValues } from "./schemas";
import { ProductStatus } from "@/shared/types/enums";
import type { ProductLifecycleAction } from "./types";
import { buildProductImagesFormData, type ProductImageAction } from "./productImages";

export async function mutateAdminProductLifecycle(id: string, action: ProductLifecycleAction, authToken: string): Promise<string> {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã sản phẩm không hợp lệ.");
  const url = `/api/admin/products/${id}`;
  const config = { meta: { authToken, noPublicRetry: true } };
  if (action.kind === "status") {
    if (!Object.values(ProductStatus).includes(action.status)) throw new ApiError(400, "Trạng thái không hợp lệ.");
    const { data } = await api.patch<string>(`${url}/status`, undefined, { ...config, params: { status: action.status } });
    return data;
  }
  if (!isPositiveLongId(action.variantId)) throw new ApiError(400, "Mã biến thể không hợp lệ.");
  if (action.kind === "reactivate") {
    const { data } = await api.patch<string>(`${url}/variants/${action.variantId}/status`, undefined, {
      ...config, params: { status: "ACTIVE" },
    });
    return data;
  }
  const { data } = await api.delete<string>(`${url}/variants/${action.variantId}`, config);
  return data;
}

export async function mutateAdminProductImages(id: string, action: ProductImageAction, authToken: string): Promise<string> {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã sản phẩm không hợp lệ.");
  const url = `/api/admin/products/${id}/images`;
  const config = { meta: { authToken, noPublicRetry: true } };
  if (action.kind === "upload") {
    const { data } = await api.post<string>(url, buildProductImagesFormData(action.files), config);
    return data;
  }
  if (!isPositiveLongId(action.imageId)) throw new ApiError(400, "Mã ảnh không hợp lệ.");
  if (action.kind === "delete") {
    const { data } = await api.delete<string>(`${url}/${action.imageId}`, config);
    return data;
  }
  const { data } = await api.patch<string>(`${url}/${action.imageId}/primary`, undefined, config);
  return data;
}

export async function getAdminProductDetail(id: string, signal: AbortSignal, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã sản phẩm không hợp lệ.");
  const { data } = await api.get<AdminProductDetailResponse>(`/api/admin/products/${id}`, {
    signal, meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateAdminProduct(id: string, values: EditProductFormValues, authToken: string): Promise<string> {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã sản phẩm không hợp lệ.");
  const { data } = await api.put<string>(`/api/admin/products/${id}`, buildUpdateProductRequest(values), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

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
