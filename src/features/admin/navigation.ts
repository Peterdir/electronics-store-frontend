import type { Permission } from "@/shared/auth/permissions";

export interface AdminNavigationItem {
    to: string;
    label: string;
    permission: Permission;
    end?: boolean;
}

export const adminNavigation: readonly AdminNavigationItem[] = [
    {
        to: "/admin",
        label: "Trang quản trị",
        permission: "admin.access",
        end: true,
    },
    {
        to: "/admin/orders",
        label: "Đơn hàng",
        permission: "order.view",
    },
];
