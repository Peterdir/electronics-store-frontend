import { lazy, Suspense } from "react";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";

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
    return <AdminHomePage />;
}
