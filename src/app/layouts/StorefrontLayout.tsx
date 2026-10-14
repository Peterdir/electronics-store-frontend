import { Link, Outlet } from "react-router"

export function StorefrontLayout() {
    return (
        <>
            <header>
                <nav aria-label="Điều hướng chính">
                    <Link to="/">Trang chủ</Link>
                    {' · '}
                    <Link to="/admin">Khu vực quản trị</Link>
                </nav>
            </header>

            <main>
                <Outlet />
            </main>

            <footer>Electronics Store</footer>
        </>
    )
};