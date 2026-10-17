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


export const router = createBrowserRouter([
    {
        path: '/',
        Component: StorefrontLayout,
        ErrorBoundary: RouteErrorBoundary,
        children: [
            { index: true, Component: HomePage },
            { path: "login", Component: LoginPage},
            { path: "account/profile", Component: ProfilePage },
        ],
    },
    {
        path: "/admin",
        Component: AdminLayout,
        ErrorBoundary: RouteErrorBoundary,
        children: [{ index: true, Component: AdminHomePage }],
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