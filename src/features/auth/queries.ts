import { useMutation, useQuery } from "@tanstack/react-query"
import { getMyProfile, login } from "./api"
import { useSession } from "@/shared/auth/session.store"
import { qk } from "@/shared/api/queryKeys"
import { isExpired } from "@/shared/auth/jwt"

export function useLogin() {
    const setSession = useSession((state) => state.setSession)

    return useMutation({
        mutationFn: login,
        retry: false,
        onSuccess: (data) => {
            setSession(data.accessToken, data.user)
        }
    })
}

export function useMe() {
    const token = useSession((state) => state.token)
    const userId = useSession((state) => state.user?.id)

    return useQuery({
        queryKey: [...qk.me, userId],
        queryFn: getMyProfile,
        enabled: Boolean(token && !isExpired(token)),
        retry: false,
    })
}