import type { ID, Money } from "@/shared/types/common";
import type { ProductStatus } from "@/shared/types/enums";

export interface GetProductsRequest {
    keyword?: string,
    page: number,
    size: number,
}

export interface ProductResponse {
    id: ID,
    name: string,
    basePrice: Money,
    primaryImageUrl: string | null,
    categoryName: string,
    brandName: string | null,
    averageRating: number | null,
    status: ProductStatus,
}