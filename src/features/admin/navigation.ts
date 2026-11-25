import type { Permission } from "@/shared/auth/permissions";

export interface AdminNavigationItem {
    to: string;
    label: string;
    permission: Permission;
    end?: boolean;
}

export const adminNavigation: readonly AdminNavigationItem[] = [
    {
        to: "/admin/return-requests",
        label: "Yêu cầu trả hàng",
        permission: "return.view",
    },
    {
        to: "/admin/reviews",
        label: "Đánh giá",
        permission: "review.view",
    },
    {
        to: "/admin/inventory",
        label: "Tồn kho",
        permission: "inventory.manage",
    },
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
    {
        to: "/admin/categories",
        label: "Danh mục",
        permission: "category.manage",
    },
    {
        to: "/admin/brands",
        label: "Thương hiệu",
        permission: "brand.manage",
    },
    {
        to: "/admin/products",
        label: "Sản phẩm",
        permission: "product.write",
    },
];
