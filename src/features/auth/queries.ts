import { useMutation } from "@tanstack/react-query"
import { login } from "./api"
import { useSession } from "@/shared/auth/session.store"

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