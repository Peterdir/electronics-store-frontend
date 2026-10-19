import { qk } from "@/shared/api/queryKeys";
import { getProducts } from "./api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GetProductsRequest } from "./types";


// GET PRODUCT
export function useGetProducts(payload: GetProductsRequest) {
    return useQuery({
        queryKey: [...qk.products, payload],
        queryFn: () => getProducts(payload),
        placeholderData: keepPreviousData,
        retry: 2,
    })
}