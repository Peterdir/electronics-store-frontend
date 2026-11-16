import { ArrowRightLeft, Cpu, Grid2X2, House, Package, ShoppingCart } from "lucide-react"
import { Link, NavLink, useLocation, useMatch, useNavigate } from "react-router"
import { UserMenu } from "@/features/auth/components/UserMenu"
import { useCart } from "@/features/cart/useCart"
import { SearchBar } from "@/features/catalog/components/SearchBar"

const navigation = [
    { to: "/", label: "Trang chủ", icon: House, end: true },
    { to: "/products", label: "Sản phẩm", icon: Grid2X2, end: false },
    { to: "/compare", label: "So sánh", icon: ArrowRightLeft, end: false },
]

export function StorefrontHeader() {
    const cart = useCart()
    const { pathname, search } = useLocation()
    const isProductList = Boolean(useMatch("/products"))
    const navigate = useNavigate()
    const keyword = isProductList ? (new URLSearchParams(search).get("q") ?? "").trim() : ""
    const cartStatus = cart.isMerging ? "đang đồng bộ sản phẩm"
        : cart.isLoading ? "đang tải số lượng sản phẩm"
        : cart.error ? "chưa tải được số lượng sản phẩm"
        : `${cart.totalItems} sản phẩm`

    function searchProducts(nextKeyword: string) {
        const params = new URLSearchParams(isProductList ? search : "")
        if (nextKeyword) params.set("q", nextKeyword)
        else params.delete("q")
        params.set("page", "1")
        navigate(`/products?${params}`)
    }

    return (
        <header className="relative z-20 border-b border-border bg-card shadow-sm">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8 lg:py-5 lg:px-8">
                <Link to="/" aria-label="Electronics Store — Trang chủ" className="flex w-fit min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary sm:size-11">
                        <Cpu aria-hidden="true" className="size-6" strokeWidth={1.7} />
                    </span>
                    <span className="flex flex-col">
                        <span className="text-base leading-tight font-bold tracking-tight sm:text-xl">Electronics<span className="text-primary">.</span></span>
                        <span className="mt-0.5 text-[10px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">Store</span>
                    </span>
                </Link>

                <SearchBar
                    key={`${pathname}:${keyword}`}
                    initialValue={keyword}
                    onSearch={searchProducts}
                    className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1"
                />

                <div className="flex items-center gap-2 sm:gap-4 lg:col-start-3">
                    <UserMenu />
                    <span aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
                    <Link to="/cart" aria-label={`Giỏ hàng, ${cartStatus}`} className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">
                        <span className="relative flex size-8 items-center justify-center">
                            <ShoppingCart aria-hidden="true" className="size-6" strokeWidth={1.7} />
                            <span aria-hidden="true" className="absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                {cart.isMerging || cart.isLoading ? "…" : cart.error ? "!" : cart.totalItems > 99 ? "99+" : cart.totalItems}
                            </span>
                        </span>
                        <span className="hidden text-sm font-semibold xl:block">Giỏ hàng</span>
                    </Link>
                </div>
            </div>

            <div className="border-t border-border/60">
                <nav aria-label="Điều hướng chính" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-7">
                        {navigation.map(({ to, label, icon: Icon, end }) => (
                            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-12 shrink-0 items-center gap-2 border-b-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:text-sm ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>
                                <Icon aria-hidden="true" className="size-4" />{label}
                            </NavLink>
                        ))}
                    </div>
                    <Link to="/account/orders" className="hidden min-h-12 shrink-0 items-center gap-2 rounded-sm text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex">
                        <Package aria-hidden="true" className="size-4" />Đơn hàng của tôi
                    </Link>
                </nav>
            </div>
        </header>
    )
}
