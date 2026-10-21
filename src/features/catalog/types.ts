import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { ActiveStatus, ProductSort, ProductStatus } from "@/shared/types/enums";

export interface GetProductsRequest {
    keyword?: string,
    categoryId?: ID,
    brandId?: ID,
    minPrice?: Money,
    maxPrice?: Money,
    sort?: ProductSort,
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

export interface CategoryResponse {
  id: ID;
  name: string;
  status: ActiveStatus;
  totalProducts: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface BrandResponse extends CategoryResponse {
  logo: string | null;
}

export interface SuggestionResponse {
    id: ID;
    name: string;
    imageUrl: string | null;
    basePrice: Money;
}