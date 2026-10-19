import { createBrowserRouter } from "react-router";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { HomePage } from "../features/home/pages/HomePage";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteErrorBoundary } from "./pages/RouteErrorBoundary";
import { ForbiddenPage } from "./pages/ForbiddenPage"
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage"
import {
    GuestOnly,
    RequireAuth,
    RequireRole,
} from "@/shared/auth/guards"
import { Role } from "@/shared/types/enums"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { CheckEmailPage } from "@/features/auth/pages/CheckEmailPage"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { ProductListPage } from "@/features/catalog/pages/ProductListPage"


export const router = createBrowserRouter([
    {
        path: '/',
        Component: StorefrontLayout,
        ErrorBoundary: RouteErrorBoundary,
        children: [
            { index: true, Component: HomePage },
            {
                path: "login",
                element: (
                    <GuestOnly>
                        <LoginPage />
                    </GuestOnly>
                ),
            },
            {
                path: "account/profile",
                element: (
                    <RequireAuth>
                        <ProfilePage />
                    </RequireAuth>
                ),
            },
            {
                path: "register",
                element: (
                    <GuestOnly>
                        <RegisterPage />
                    </GuestOnly>
                ),
            },
            {
                path: "register/check-email",
                Component: CheckEmailPage,
            },
            {
                path: "verify-email",
                Component: VerifyEmailPage,
            },
            {
                path: "forgot-password",
                Component: ForgotPasswordPage,
            },
            {
                path: "reset-password",
                Component: ResetPasswordPage,
            },
            {
                path: "/products",
                Component: ProductListPage
            },
        ],
    },
    {
        path: "/admin",
        element: (
            <RequireRole
                roles={[Role.ADMIN, Role.MANAGER, Role.STAFF]}
            >
                <AdminLayout />
            </RequireRole>
        ),
        ErrorBoundary: RouteErrorBoundary,
        children: [
            {
                index: true,
                Component: AdminHomePage,
            },
        ],
    },
    {
        path: '/forbidden',
        Component: ForbiddenPage,
        ErrorBoundary: RouteErrorBoundary,
    },
    {
        path: '*',
        Component: NotFoundPage,
        ErrorBoundary: RouteErrorBoundary,
    },
])
