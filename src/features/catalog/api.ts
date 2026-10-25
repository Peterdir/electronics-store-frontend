import { api } from "@/shared/api/client";
import type { BrandResponse, CategoryResponse, GetProductsRequest, ProductCompareResponse, ProductDetailsResponse, ProductResponse, SuggestionResponse } from "./types";
import type { ID, Page } from "@/shared/types/common";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";


export async function getProducts(
    payload: GetProductsRequest,
): Promise<Page<ProductResponse>> {
    const response = await api.get<BackendPage<ProductResponse>>(
        "/api/products", 
        {
            params: payload,
        }
    );

    return normalizePage(response.data);
}

export async function getCategories(): Promise<CategoryResponse[]> {
    const response = await api.get<CategoryResponse[]>("/api/categories")

    return response.data;
}

export async function getBrands(): Promise<BrandResponse[]> {
    const response = await api.get<BrandResponse[]>("/api/brands")

    return response.data;
}

export async function getProductSuggestions(
    keyword: string,
    signal?: AbortSignal,
): Promise<SuggestionResponse[]> {
    const response = await api.get<SuggestionResponse[]>(
        "/api/products/suggest",
        {
            params: { q: keyword },
            signal,
        },
    );

    return response.data;
}

export async function getProductDetails(
    id: ID,
): Promise<ProductDetailsResponse> {
    const response = await api.get<ProductDetailsResponse>(`/api/products/${id}`)

    return response.data;
}

export async function getProductCompare(
  ids: ID[],
  signal?: AbortSignal,
): Promise<ProductCompareResponse[]> {
  const response = await api.get<ProductCompareResponse[]>(
    "/api/products/compare",
    {
      params: { ids },
      paramsSerializer: { indexes: null },
      signal,
    },
  );

  return response.data;
}