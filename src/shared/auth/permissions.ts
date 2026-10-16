import { Role } from "../types/enums";
import type { Role as RoleType } from "../types/enums";
import { useSession } from "./session.store";

export const PERMISSIONS = {
    "dashboard.view": [Role.ADMIN, Role.MANAGER],
    "report.view": [Role.ADMIN, Role.MANAGER],
    "user.view": [Role.ADMIN, Role.MANAGER],
    "user.changeRole": [Role.ADMIN],
    "category.manage": [Role.ADMIN, Role.MANAGER],
    "brand.manage": [Role.ADMIN, Role.MANAGER],
    "product.write": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "product.changeStatus": [Role.ADMIN, Role.MANAGER],
    "inventory.manage": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "order.view": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "order.updateStatus": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "order.cancel": [Role.ADMIN, Role.MANAGER],
    "coupon.view": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "coupon.manage": [Role.ADMIN, Role.MANAGER],
    "return.view": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "return.process": [Role.ADMIN, Role.MANAGER],
    "review.view": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "review.reply": [Role.ADMIN, Role.MANAGER, Role.STAFF],
    "review.toggle": [Role.ADMIN, Role.MANAGER],
} as const satisfies Record<string, RoleType[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
    permission: Permission,
    role: RoleType | null | undefined
): boolean{
    if (!role) {
        return false;
    }

    const allowedRoles: RoleType[] = PERMISSIONS[permission];
    return allowedRoles.includes(role);
}

export function useCan(permission: Permission): boolean {
  const role = useSession((state) => state.user?.role);
  return hasPermission(permission, role);
}