import { api } from "@/shared/api/client";
import type { BrandResponse, CategoryResponse, GetProductsRequest, ProductDetailsResponse, ProductResponse, SuggestionResponse } from "./types";
import type { ID, Page } from "@/shared/types/common";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";


// GET PRODUCTS
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

// GET CATEGORIES
export async function getCategories(): Promise<CategoryResponse[]> {
    const response = await api.get<CategoryResponse[]>("/api/categories")

    return response.data;
}

// GET BRANDS
export async function getBrands(): Promise<BrandResponse[]> {
    const response = await api.get<BrandResponse[]>("/api/brands")

    return response.data;
}

// GET SUGGESTS
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

// GET PRODUCT DETAILS
export async function getProductDetails(
    id: ID,
): Promise<ProductDetailsResponse> {
    const response = await api.get<ProductDetailsResponse>(`/api/products/${id}`)

    return response.data;
}