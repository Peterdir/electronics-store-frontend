import { createBrowserRouter, Navigate } from "react-router";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { HomePage } from "../features/home/pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteErrorBoundary } from "./pages/RouteErrorBoundary";
import { ForbiddenPage } from "./pages/ForbiddenPage"
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage"
import {
    GuestOnly,
    RequireAuth,
} from "@/shared/auth/guards"
import { AdminIndexRoute, AdminRoute } from "./routes/AdminRoute";
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { CheckEmailPage } from "@/features/auth/pages/CheckEmailPage"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { ProductListPage } from "@/features/catalog/pages/ProductListPage"
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";
import { ComparePage } from "@/features/catalog/pages/ComparePage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage";
import { CheckoutSuccessPage } from "@/features/checkout/pages/CheckoutSuccessPage";
import { AddressesPage } from "@/features/address/pages/AddressesPage";
import { PaymentResultPage } from "@/features/payment/pages/PaymentResultPage";
import { AccountLayout } from "./layouts/AccountLayout";
import { ChangePasswordPage } from "@/features/auth/pages/ChangePasswordPage";
import { OrdersPage } from "@/features/orders/pages/OrdersPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { ReviewsPage } from "@/features/reviews/pages/ReviewsPage";
import { WishlistPage } from "@/features/wishlist/pages/WishlistPage";
import { ReturnRequestPage } from "@/features/returns/pages/ReturnRequestPage";

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
            { 
                path: "products/:id", 
                Component: ProductDetailPage 
            },
            {
                path: "compare",
                Component: ComparePage,
            },
            {
                path: "cart",
                Component: CartPage,
            },
            {
                path: "checkout",
                Component: CheckoutPage,
            },
            {
                path: "checkout/success/:orderId",
                Component: CheckoutSuccessPage,
            },
            {
                path: "account",
                element: (
                    <RequireAuth>
                        <AccountLayout />
                    </RequireAuth>
                ),
                children: [
                    {
                        index: true,
                        element: <Navigate to="profile" replace />,
                    },
                    {
                        path: "profile",
                        Component: ProfilePage,
                    },
                    {
                        path: "addresses",
                        Component: AddressesPage,
                    },
                    {
                        path: "password",
                        Component: ChangePasswordPage,
                    },
                    {
                        path: "orders",
                        Component: OrdersPage,
                    },
                    {
                        path: "orders/:id",
                        Component: OrderDetailPage,
                    },
                    {
                        path: "reviews",
                        Component: ReviewsPage,
                    },
                    {
                        path: "wishlist",
                        Component: WishlistPage,
                    },
                    {
                        path: "returns/new",
                        Component: ReturnRequestPage,
                    },
                ],
            },
            {
                path: "payment/result",
                Component: PaymentResultPage,
            },
        ],
    },
    {
        path: "/admin",
        Component: AdminRoute,
        ErrorBoundary: RouteErrorBoundary,
        children: [
            {
                index: true,
                Component: AdminIndexRoute,
            },
            {
                path: "orders",
                lazy: async () => {
                    const { AdminOrdersPage } = await import("@/features/admin/orders/pages/AdminOrdersPage");
                    return { Component: AdminOrdersPage };
                },
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
