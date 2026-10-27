import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { addCartItem, getCart } from "./api";
import { isExpired } from "@/shared/auth/jwt";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



export function useServerCart() {
    const token = useSession((state) => state.token);
    const userId = useSession((state) => state.user?.id);

    return useQuery({
        queryKey: [...qk.cart, userId],
        queryFn: ({ signal }) => getCart(signal),
        enabled: Boolean(token && userId && !isExpired(token)),
        retry:false,
    });
}

export function useAddCartItem() {
    const queryClient = useQueryClient();
    const userId = useSession((state) => state.user?.id);

    return useMutation({
        mutationFn: addCartItem,
        retry: false,

        onSuccess: async (cart) => {
            if (!userId || useSession.getState().user?.id !== userId) return;

            const cartKey = [...qk.cart, userId];

            await queryClient.cancelQueries({ queryKey: cartKey });
            queryClient.setQueryData(cartKey, cart);
        },
    })
}