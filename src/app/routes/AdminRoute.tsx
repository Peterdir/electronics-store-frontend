import { lazy, Suspense } from "react";
import { Navigate } from "react-router";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS, useCan } from "@/shared/auth/permissions";

const AdminLayout = lazy(() =>
    import("../layouts/AdminLayout").then((module) => ({
        default: module.AdminLayout,
    })),
);

const AdminHomePage = lazy(() =>
    import("@/features/admin/pages/AdminHomePage").then((module) => ({
        default: module.AdminHomePage,
    })),
);

export function AdminRoute() {
    return (
        <RequireRole roles={PERMISSIONS["admin.access"]}>
            <Suspense
                fallback={
                    <main className="p-6">
                        <p role="status">Đang tải khu vực quản trị…</p>
                    </main>
                }
            >
                <AdminLayout />
            </Suspense>
        </RequireRole>
    );
}

export function AdminIndexRoute() {
    const canViewDashboard = useCan("dashboard.view");
    const canViewOrders = useCan("order.view");

    if (canViewDashboard) return <Navigate to="/admin/dashboard" replace />;
    if (canViewOrders) return <Navigate to="/admin/orders" replace />;
    return <AdminHomePage />;
}
