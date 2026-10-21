import { qk } from "@/shared/api/queryKeys";
import { getBrands, getCategories, getProducts, getProductSuggestions } from "./api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GetProductsRequest } from "./types";


// GET PRODUCTS
export function useGetProducts(payload: GetProductsRequest) {
    return useQuery({
        queryKey: [...qk.products, payload],
        queryFn: () => getProducts(payload),
        placeholderData: keepPreviousData,
        retry: 2,
    })
}

// GET CATEGORIES
export function useGetCategories() {
    return useQuery({
        queryKey: [...qk.categories],
        queryFn: () => getCategories(),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    })
}

// GET BRANDS
export function useGetBrands() {
    return useQuery({
        queryKey: [...qk.brands],
        queryFn: () => getBrands(),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    })
}

// GET SUGGESTIONS
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