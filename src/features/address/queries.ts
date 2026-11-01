import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/api/queryKeys";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./api";

export function useGetAddresses() {
  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id);

  return useQuery({
    queryKey: [...qk.addresses, userId],
    queryFn: ({ signal }) => getAddresses(signal),
    enabled: Boolean(token && userId && !isExpired(token)),
    retry: false,
  });
}

function useRefreshAddresses() {
  const client = useQueryClient();
  const userId = useSession((state) => state.user?.id);

  return async () => {
    if (userId && useSession.getState().user?.id === userId) {
      await client.invalidateQueries({
        queryKey: [...qk.addresses, userId],
      });
    }
  };
}

export function useCreateAddress() {
  const refresh = useRefreshAddresses();
  return useMutation({
    mutationFn: createAddress,
    retry: false,
    onSuccess: refresh,
  });
}

export function useUpdateAddress() {
  const refresh = useRefreshAddresses();
  return useMutation({
    mutationFn: updateAddress,
    retry: false,
    onSuccess: refresh,
  });
}

export function useDeleteAddress() {
  const refresh = useRefreshAddresses();
  return useMutation({
    mutationFn: deleteAddress,
    retry: false,
    onSuccess: refresh,
  });
}

export function useSetDefaultAddress() {
  const refresh = useRefreshAddresses();
  return useMutation({
    mutationFn: setDefaultAddress,
    retry: false,
    onSuccess: refresh,
  });
}
