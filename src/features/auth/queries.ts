import { useMutation, useQuery } from "@tanstack/react-query"
import { getMyProfile, login, logout, registerAccount, resendVerification, verifyEmail } from "./api"
import { useSession } from "@/shared/auth/session.store"
import { qk } from "@/shared/api/queryKeys"
import { isExpired } from "@/shared/auth/jwt"
import { toast } from "sonner"

// LOGIN
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

// PROFILE
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

// LOGOUT
export function useLogout() {
    return useMutation({
        retry: false,
        mutationFn: async (token: string | null) => {
            if (!token) return

            try {
                await logout(token)
            } catch {
                if (useSession.getState().token === token) {
                    toast.warning(
                        "Đã đăng xuất trên thiết bị này. Chưa thể xác nhận đăng xuất trên máy chủ.",
                    )
                }
            } finally {
                const currentSession = useSession.getState()

                if (currentSession.token === token) {
                    currentSession.clear({ reason: "logout" })
                }
            }
        },
    })
}

// REGISTER
export function useRegister() {
    return useMutation({
        mutationFn: registerAccount,
        retry: false,
    })
}

// RESEND VERIFICATION
export function useResendVerification() {
    return useMutation({
        mutationFn: resendVerification,
        retry: false,
    })
}

// VERIFY EMAIL
export function useVerifyEmail() {
    const setSession = useSession((state) => state.setSession)

    return useMutation({
        mutationFn: verifyEmail,
        retry: false,
        onSuccess: (data) => {
            setSession(data.accessToken, data.user)
        },
    })
}