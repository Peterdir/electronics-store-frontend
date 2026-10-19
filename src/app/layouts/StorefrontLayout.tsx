import { Link, Outlet } from "react-router"
import { UserMenu } from "@/features/auth/components/UserMenu"

export function StorefrontLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="border-b border-border">
                <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link to="/"
                        className="rounded-sm text-lg font-bold tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >Electronics Store
                    </Link>

                    <nav
                        aria-label="Điều hướng chính"
                        className="flex flex-wrap items-center gap-6 text-sm"
                    >
                        <Link to="/" className="rounded-sm text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            Trang chủ
                        </Link>

                        <Link to="/admin" className="rounded-sm text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            Khu vực quản trị
                        </Link>

                        <UserMenu />

                        <Link to="/products" className="rounded-sm text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            Sản phẩm
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            <footer className="border-t border-border">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                    Electronics Store
                </div>
            </footer>
        </div>
    )
}
