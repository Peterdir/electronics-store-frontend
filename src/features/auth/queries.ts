import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { forgotPassword, getMyProfile, login, logout, registerAccount, resendVerification, resetPassword, updateMyProfile, verifyEmail } from "./api"
import { useSession } from "@/shared/auth/session.store"
import { qk } from "@/shared/api/queryKeys"
import { isExpired } from "@/shared/auth/jwt"
import { toast } from "sonner"
import { startGuestCartMerge } from "../cart/mergeGuestCart"
import type { UpdateProfileRequest, UserProfileResponse } from "./types"

export function useLogin() {
    const setSession = useSession((state) => state.setSession)

    return useMutation({
        mutationFn: login,
        retry: false,
        onSuccess: (data) => {
            setSession(data.accessToken, data.user);

            void startGuestCartMerge(
                data.accessToken,
                data.user.id,
            ).catch(() => {
                toast.error("Không thể đồng bộ giỏ hàng. Sản phẩm guest vẫn được lưu.");
            });
        }
    })
}

export function useMe() {
    const token = useSession((state) => state.token)
    const userId = useSession((state) => state.user?.id)

    return useQuery({
        queryKey: [...qk.me, userId],
        queryFn: ({ signal }) =>
            getMyProfile(signal, token ?? undefined),
        enabled: Boolean(userId && token && !isExpired(token)),
        retry: false,
    })
}

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

export function useRegister() {
    return useMutation({
        mutationFn: registerAccount,
        retry: false,
    })
}

export function useResendVerification() {
    return useMutation({
        mutationFn: resendVerification,
        retry: false,
    })
}

export function useVerifyEmail() {
    const setSession = useSession((state) => state.setSession)

    return useMutation({
        mutationFn: verifyEmail,
        retry: false,
        onSuccess: (data) => {
            setSession(data.accessToken, data.user);

            void startGuestCartMerge(
                data.accessToken,
                data.user.id,
            ).catch(() => {
                toast.error("Không thể đồng bộ giỏ hàng. Sản phẩm guest vẫn được lưu.");
            });
        },
    })
}

export function useForgotPassword() {
    return useMutation({ 
        mutationFn: forgotPassword, 
        retry: false 
    })
}

export function useResetPassword() {
    return useMutation({ 
        mutationFn: resetPassword, 
        retry: false 
    })
}

interface UpdateProfileVariables {
    payload: UpdateProfileRequest
    userId: string
    token: string
}

export function isCurrentProfileSession(
    session: { userId: string; token: string },
): boolean {
    const current = useSession.getState()

    return (
        current.user?.id === session.userId &&
        current.token === session.token &&
        !isExpired(session.token)
    )
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()

    return useMutation({
        retry: false,

        networkMode: "always",

        mutationFn: async (variables: UpdateProfileVariables) => {
            const { payload, userId, token } = variables

            if (!isCurrentProfileSession(variables)) {
                return null
            }

            const response = await updateMyProfile(payload, token)

            if (!isCurrentProfileSession(variables)) {
                return null
            }

            const queryKey = [...qk.me, userId]

            try {
                await queryClient.invalidateQueries(
                    {
                        queryKey,
                        exact: true,
                        refetchType: "all",
                    },
                    {
                        throwOnError: true,
                    },
                )
            } catch {
                if (!isCurrentProfileSession(variables)) {
                    return null
                }

                return {
                    message: response.message,
                    profile: null,
                }
            }

            if (!isCurrentProfileSession(variables)) {
                return null
            }

            const state =
                queryClient.getQueryState<UserProfileResponse>(
                    queryKey,
                )

            const profile =
                state?.status === "success" &&
                !state.isInvalidated &&
                state.data?.id === userId
                    ? state.data
                    : null

            return {
                message: response.message,
                profile,
            }
        },
    })
}