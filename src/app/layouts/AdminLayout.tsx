import { Suspense } from "react"
import { Link, Outlet } from "react-router"
import { UserMenu } from "@/features/auth/components/UserMenu"
import { AdminSidebar } from "@/features/admin/components/AdminSidebar"

export function AdminLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <a
                href="#admin-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
            >
                Đến nội dung chính
            </a>
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex min-h-16 max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <Link
                        to="/admin"
                        className="rounded-sm font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Electronics Store
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            Quản trị
                        </span>
                    </Link>

                    <div className="flex min-w-0 flex-wrap items-center gap-4">
                        <UserMenu />

                        <Link
                            to="/"
                            className="rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Về trang chủ
                        </Link>
                    </div>
                </div>
            </header>
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-screen-2xl md:grid-cols-[15rem_minmax(0,1fr)]">
                <AdminSidebar />

                <main
                    id="admin-content"
                    tabIndex={-1}
                    className="min-w-0 p-4 focus-visible:outline-2 focus-visible:outline-ring sm:p-6 lg:p-8"
                >
                    <Suspense
                        fallback={
                            <p role="status" className="text-sm text-muted-foreground">
                                Đang tải nội dung quản trị…
                            </p>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    )
}
