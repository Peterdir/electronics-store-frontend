import {Link, Outlet} from 'react-router'

export function  AdminLayout() {
    return (
        <div>
            <header>
                <Link to="/">Electronics Store</Link>
            </header>

            <div>
                <nav aria-label="Điều hướng quản trị">
                    <Link to="/admin">Tổng quan</Link>
                </nav>

                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}