import { NavLink, Outlet } from "react-router";

const accountLinks = [
  {
    to: "/account/profile",
    label: "Hồ sơ",
  },
  {
    to: "/account/addresses",
    label: "Sổ địa chỉ",
  },
  {
    to: "/account/password",
    label: "Đổi mật khẩu",
  },
  {
    to:"/account/orders",
    label: "Đơn hàng",
  },
];

export function AccountLayout() {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 self-start rounded-2xl border border-border bg-card p-4">
        <p className="mb-4 text-lg font-semibold">
          Tài khoản
        </p>

        <nav
          aria-label="Điều hướng tài khoản"
          className="flex gap-2 overflow-x-auto lg:flex-col"
        >
          {accountLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}