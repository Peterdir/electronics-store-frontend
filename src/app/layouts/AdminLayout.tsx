import {Link, NavLink, Outlet} from 'react-router'

export function  AdminLayout() {
    return (
        <div className="dark min-h-screen bg-muted/30 text-foreground">
            <header className="border-b bg-background">
                <div className="mx-auto flex items-center h-16 max-w-screen-2xl justify-between px-4 sm:px-6">
                    <Link to="/admin" className="rounded-sm font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Electronics Store
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            Quản trị
                        </span>
                    </Link>
                    <Link to="/" className="rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Về trang chủ
                    </Link>
                </div>
            </header>
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-screen-2xl md:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="border-b bg-background p-4 md:border-b-0 md:border-r">
                    <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Điều hướng
                    </p>
                    <nav aria-label="Điều hướng quản trị" className="space-y-1">
                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) =>
                                [
                                "flex rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                ].join(" ")
                            }
                        >
                            Tổng quan
                        </NavLink>
                    </nav>
                </aside>

                <main
                    id="admin-content"
                    className="min-w-0 p-4 sm:p-6 lg:p-8"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}