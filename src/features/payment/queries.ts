import { useQuery } from "@tanstack/react-query";
import { verifyVnpayReturn } from "./api";

export function useVnpayReturn(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ["payment", "vnpay", "return", search],
    queryFn: () => verifyVnpayReturn(search),
    enabled,

    retry: false,
    retryOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always",
  });
}