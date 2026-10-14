import { createBrowserRouter } from "react-router";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { HomePage } from "../features/home/pages/HomePage";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { NotFoundPage } from "./pages/NotFoundPage";


export const router = createBrowserRouter([
    {
        path: '/',
        Component: StorefrontLayout,
        children: [{ index: true, Component: HomePage }],
    },
    {
        path: "/admin",
        Component: AdminLayout,
        children: [{ index: true, Component: AdminHomePage }],
    },
    {
        path: '*',
        Component: NotFoundPage,
    },
])