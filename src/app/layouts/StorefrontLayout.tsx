import { Outlet, useLocation } from "react-router"
import { StorefrontHeader } from "./StorefrontHeader"
import { CompareTray } from "@/features/catalog/components/CompareTray";
import { useCompare } from "@/features/catalog/compare.store";
import { useCallback, useRef } from "react";


export function StorefrontLayout() {

    const hasCompare = useCompare((state) => state.compareIds.length > 0);
    const layoutRef = useRef<HTMLDivElement>(null);
    const updateCompareTrayHeight = useCallback((height: number) => {
        layoutRef.current?.style.setProperty("--compare-tray-height", `${height}px`);
    }, []);
    const { pathname } = useLocation();
    const showCompareTray = hasCompare && pathname !== "/compare";

    return (
        <div
            ref={layoutRef}
            className="flex min-h-screen flex-col bg-background text-foreground"
            style={showCompareTray ? { paddingBottom: "var(--compare-tray-height, 272px)" } : undefined}
        >
            <StorefrontHeader />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                    Electronics Store
                </div>
            </footer>

            {showCompareTray && <CompareTray onHeightChange={updateCompareTrayHeight} />}
        </div>
    )
}
