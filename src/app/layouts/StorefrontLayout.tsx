import { Outlet, useLocation } from "react-router"
import { StorefrontHeader } from "./StorefrontHeader"
import { CompareTray } from "@/features/catalog/components/CompareTray";
import { useCompare } from "@/features/catalog/compare.store";


export function StorefrontLayout() {

    const hasCompare = useCompare((state) => state.compareIds.length > 0);
    const { pathname } = useLocation();
    const showCompareTray = hasCompare && pathname !== "/compare";

    return (
        <div className={`flex flex-col min-h-screen bg-background text-foreground ${
            showCompareTray ? "pb-64" : ""
        }`}>
            <StorefrontHeader />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                    Electronics Store
                </div>
            </footer>

            {showCompareTray && <CompareTray />}
        </div>
    )
}
