import type { ID, ISODateTime, Money } from "@/shared/types/common";
import type { ProductStatus } from "@/shared/types/enums";

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
