import { api } from "@/shared/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfileResponse } from "./types";
import type { MessageResponse } from "@/shared/types/common"

// LOGIN
export async function login(
    payload: LoginRequest,
): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
        "/api/auth/login",
        payload,
        {
            headers: {
                "X-Skip-Auth": "1",
            },
        },
    )

    return response.data;
}

// PROFILE
export async function getMyProfile(): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>(
        "/api/users/me",
    )

    return response.data
}

// LOGOUT
export async function logout(
    token: string,
): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
        "/api/auth/logout",
        undefined,
        {
            meta: {
                authToken: token,
                noPublicRetry: true,
            },
        },
    )

    return response.data
}

// REGISTER
export async function registerAccount(
    payload: RegisterRequest,
): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
        "/api/auth/register",
        payload,
        {
            headers: {
                "X-Skip-Auth": "1",
            },
        },
    )

    return response.data
}

// RESEND VERIFICATION
export async function resendVerification(
    email: string,
): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
        "/api/auth/resend-verification",
        { email },
        {
            headers: {
                "X-Skip-Auth": "1",
            }
        }
    )

    return response.data;
}

// VERIFY EMAIL
export async function verifyEmail(
    token: string,
): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>(
        "/api/auth/verify",
        {
            params: { token },
            headers: {
                "X-Skip-Auth": "1",
            },
        },
    )

    return response.data
}