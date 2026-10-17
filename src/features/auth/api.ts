import { api } from "@/shared/api/client";
import type { AuthResponse, LoginRequest, UserProfileResponse } from "./types";
import type { MessageResponse } from "@/shared/types/common"

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

export async function getMyProfile(): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>(
        "/api/users/me",
    )

    return response.data
}

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