import { api } from "@/shared/api/client";
import type { AuthResponse, LoginRequest } from "./types";

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