import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { ProductStatus } from "@/shared/types/enums";

export type ProductLifecycleAction =
  | { kind: "status"; status: ProductStatus }
  | { kind: "deactivate"; variantId: ID }
  | { kind: "reactivate"; variantId: ID };

export interface AdminProductListResponse {
  id: ID;
  name: string;
  basePrice: Money;
  primaryImageUrl: string | null;
  categoryId: ID | null;
  categoryName: string | null;
  brandId: ID | null;
  brandName: string | null;
  status: ProductStatus;
  totalStock: number;
  variantCount: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type AdminProductSortBy = "createdAt" | "name" | "basePrice";

export interface AdminProductsFilters {
  keyword: string;
  status?: ProductStatus;
  categoryId?: ID;
  brandId?: ID;
  page: number;
  size: number;
  sortBy: AdminProductSortBy;
  direction: "asc" | "desc";
}

export type GetAdminProductsParams = AdminProductsFilters;

export interface AdminProductVariantRequest {
  sku: string;
  price: Money;
  stock: number;
  attributes: Record<string, string>;
}

export interface CreateAdminProductRequest {
  name: string;
  categoryId: ID;
  brandId: ID | null;
  basePrice: Money;
  description: string;
  specification: Record<string, string>;
  variants: AdminProductVariantRequest[];
}

export interface AdminProductImageResponse {
  id: ID;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean | null;
}

export interface AdminProductVariantResponse {
  id: ID;
  sku: string;
  price: Money;
  stock: number;
  imageUrl: string | null;
  images: AdminProductImageResponse[] | null;
  attributes: Record<string, unknown> | null;
  status: ProductStatus;
}

export interface AdminProductDetailResponse extends Omit<AdminProductListResponse, "primaryImageUrl" | "variantCount"> {
  description: string | null;
  specification: Record<string, unknown> | null;
  images: AdminProductImageResponse[] | null;
  variants: AdminProductVariantResponse[] | null;
}

export interface UpdateAdminProductRequest extends Omit<CreateAdminProductRequest, "variants" | "specification"> {
  specification: Record<string, unknown>;
  variants?: never;
}
