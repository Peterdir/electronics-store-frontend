import type { Attributes, ID, ISODateTime, Money } from "@/shared/types/common";
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

export interface ProductImageDetailResponse {
  id: ID;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean | null;
}

export interface VariantResponse {
  id: ID;
  sku: string;
  price: Money;
  stock: number;
  imageUrl: string | null;
  images: ProductImageDetailResponse[] | null;
  attributes: Attributes | null;
  status: ProductStatus;
}

export interface ProductDetailsResponse {
  id: ID;
  name: string;
  basePrice: Money;
  description: string | null;
  specification: Attributes | null;
  images: string[] | null;
  categoryName: string | null,
  brandName: string | null,
  variants: VariantResponse[] | null;
  stock: number;
  averageRating: number | null;
}
