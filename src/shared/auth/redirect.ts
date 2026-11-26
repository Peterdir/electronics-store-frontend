import type { Role as RoleType } from "@/shared/types/enums"
import { isPositiveLongId } from "../types/common"
import { hasPermission } from "./permissions"
import { Role } from "../types/enums"

export function getLoginDestination(
    role: RoleType | undefined,
    redirect?: string | null,
    from?: string | null,
): string {
    const canAccessAdmin = hasPermission("admin.access", role)

    const fallback = role === Role.STAFF ? "/admin/orders" : canAccessAdmin ? "/admin" : "/"

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
            const adminOrderDetailMatch = /^\/admin\/orders\/([^/]+)\/?$/.exec(url.pathname);
            const adminProductEditMatch = /^\/admin\/products\/([^/]+)\/edit\/?$/.exec(url.pathname);
            const productDetailMatch = /^\/products\/([^/]+)\/?$/.exec(url.pathname);
            const allowed =
                url.pathname === "/" ||
                url.pathname === "/account" ||
                url.pathname === "/account/profile" ||
                url.pathname === "/account/addresses" ||
                url.pathname === "/account/password" ||
                url.pathname === "/account/orders" ||
                url.pathname === "/account/reviews" ||
                url.pathname === "/account/wishlist" ||
                url.pathname === "/account/returns/new" ||
                url.pathname === "/products" ||
                isPositiveLongId(productDetailMatch?.[1]) ||
                isPositiveLongId(orderDetailMatch?.[1]) ||
                (url.pathname === "/admin/categories" && hasPermission("category.manage", role)) ||
                (url.pathname === "/admin/brands" && hasPermission("brand.manage", role)) ||
                (url.pathname === "/admin/inventory" && hasPermission("inventory.manage", role)) ||
                (url.pathname === "/admin/return-requests" && hasPermission("return.view", role)) ||
                (url.pathname === "/admin/reviews" && hasPermission("review.view", role)) ||
                (url.pathname === "/admin/coupons" && hasPermission("coupon.view", role)) ||
                ((url.pathname === "/admin/products" || url.pathname === "/admin/products/new" || isPositiveLongId(adminProductEditMatch?.[1])) && hasPermission("product.write", role)) ||
                (
                    (url.pathname === "/admin" || url.pathname === "/admin/orders" ||
                        isPositiveLongId(adminOrderDetailMatch?.[1])) &&
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
