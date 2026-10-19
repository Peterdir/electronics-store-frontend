import { api } from "@/shared/api/client";
import type { GetProductsRequest, ProductResponse } from "./types";
import type { Page } from "@/shared/types/common";
import { normalizePage, type BackendPage } from "@/shared/api/pagination";


// GET PRODUCT
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