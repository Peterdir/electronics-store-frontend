import { qk } from "@/shared/api/queryKeys";
import { getBrands, getCategories, getCategoryPriceBounds, getProductCompare, getProductDetails, getProducts, getProductSuggestions } from "./api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GetProductsRequest } from "./types";
import type { ID } from "@/shared/types/common";


export function useGetProducts(payload: GetProductsRequest, enabled = true) {
    return useQuery({
        queryKey: [...qk.products, payload] as const,
        queryFn: () => getProducts(payload),
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[1].categoryId === payload.categoryId
                ? keepPreviousData(previousData)
                : undefined,
        retry: 2,
        enabled,
    })
}

export function useGetCategories() {
    return useQuery({
        queryKey: [...qk.categories],
        queryFn: () => getCategories(),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    })
}

export function useGetBrands() {
    return useQuery({
        queryKey: [...qk.brands],
        queryFn: () => getBrands(),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    })
}

export function useProductSuggestions(
    keyword: string,
    enabled: boolean,
) {
    return useQuery({
        queryKey: [...qk.products, "suggest", keyword],
        queryFn: ({ signal }) =>
            getProductSuggestions(keyword, signal),
        enabled: enabled && keyword.length > 0,
        staleTime: 30_000,
        retry: false,
    });
}

export function useGetProductDetails(
    id: ID
) {
    return useQuery({
        queryKey: [...qk.products, "detail", id],
        queryFn: () => getProductDetails(id),
        enabled: Boolean(id),
        retry: false,
    })
}

export function useGetProductCompare(ids: ID[]) {
  return useQuery({
    queryKey: [...qk.products, "compare", ids],
    queryFn: ({ signal }) => getProductCompare(ids, signal),
    enabled: ids.length >= 2,
    retry: false,
  });
}

export function useCategoryPriceBounds(categoryId?: ID) {
  return useQuery({
    queryKey: [...qk.products, "price-bounds", categoryId],
    queryFn: () => {
      if (!categoryId) {
        throw new Error("Chưa chọn danh mục");
      }

      return getCategoryPriceBounds(categoryId);
    },
    enabled: Boolean(categoryId),
  });
}
