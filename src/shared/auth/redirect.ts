import { Role } from "@/shared/types/enums"
import type { Role as RoleType } from "@/shared/types/enums"
import { isPositiveLongId } from "../types/common"

export function getLoginDestination(
    role: RoleType | undefined,
    redirect?: string | null,
    from?: string | null,
): string {
    const canAccessAdmin =
        role === Role.ADMIN ||
        role === Role.MANAGER ||
        role === Role.STAFF

    const fallback = canAccessAdmin ? "/admin" : "/"

    for (const candidate of [redirect, from]) {
        if (
            typeof candidate !== "string" ||
            !candidate.startsWith("/") ||
            candidate.startsWith("//") ||
            candidate.includes("\\")
        ) {
            continue
        }

        try {
            const url = new URL(candidate, window.location.origin)

            if (url.origin !== window.location.origin) {
                continue
            }
            
            const orderDetailMatch = /^\/account\/orders\/([^/]+)\/?$/.exec(url.pathname);
            const allowed =
                url.pathname === "/" ||
                url.pathname === "/account" ||
                url.pathname === "/account/profile" ||
                url.pathname === "/account/addresses" ||
                url.pathname === "/account/password" ||
                url.pathname === "/account/orders" ||
                isPositiveLongId(orderDetailMatch?.[1]) ||
                (
                    url.pathname === "/admin" &&
                    canAccessAdmin
                )

            if (allowed) {
                return `${url.pathname}${url.search}${url.hash}`
            }
        } catch {
            continue
        }
    }

    return fallback
}