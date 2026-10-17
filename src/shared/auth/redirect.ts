import { Role } from "@/shared/types/enums"
import type { Role as RoleType } from "@/shared/types/enums"

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

            const allowed =
                url.pathname === "/" ||
                url.pathname === "/account/profile" ||
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