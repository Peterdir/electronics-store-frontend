import type { ID } from "@/shared/types/common"
import type { Role, UserStatus } from "@/shared/types/enums"

export interface LoginRequest {
    email: string
    password: string
}

export interface UserResponse {
    id: ID
    email: string
    status: UserStatus
    role: Role
}

export interface AuthResponse {
    accessToken: string
    tokenType: "Bearer"
    user: UserResponse
}

export interface UserProfileResponse {
    id: ID
    fullName: string | null
    email: string
    phone: string | null
}