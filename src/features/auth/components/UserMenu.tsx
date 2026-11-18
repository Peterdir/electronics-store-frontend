import { Link } from "react-router"
import { Menu } from "@base-ui/react/menu"
import { ChevronDown, Heart, LogOut, Package, UserRound } from "lucide-react"
import { useLogout, useMe } from "@/features/auth/queries"
import { useSession } from "@/shared/auth/session.store"

export function UserMenu() {
    const user = useSession((state) => state.user)
    const profileQuery = useMe()
    const logoutMutation = useLogout()

    function handleLogout() {
        if (logoutMutation.isPending) return

        const token = useSession.getState().token

        logoutMutation.mutate(token)
    }

    if (!user) {
        return (
            <Link
                to="/login"
                className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 text-sm transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                aria-label="Đăng nhập tài khoản"
            >
                <UserRound aria-hidden="true" className="size-6" strokeWidth={1.7} />
                <span className="hidden text-left sm:block">
                    <span className="block text-[11px] text-muted-foreground">Xin chào!</span>
                    <span className="block font-semibold">Đăng nhập</span>
                </span>
            </Link>
        )
    }

    const profile = profileQuery.data?.id === user.id ? profileQuery.data : undefined
    const displayName = profile?.fullName?.trim() || "Người dùng"

    return (
        <Menu.Root>
            <Menu.Trigger aria-label={`Tài khoản của ${displayName}`} title={displayName} className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent sm:px-3">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {displayName.charAt(0).toLocaleUpperCase("vi-VN")}
                </span>
                <span className="hidden min-w-0 sm:block">
                    <span className="block text-[11px] text-muted-foreground">Xin chào,</span>
                    <span className="block max-w-32 truncate text-sm font-semibold">{displayName}</span>
                </span>
                <ChevronDown aria-hidden="true" className="hidden size-3.5 text-muted-foreground sm:block" />
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner align="end" sideOffset={10} className="z-50">
                    <Menu.Popup className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none">
                        <div className="px-3 py-3">
                            <p className="text-xs text-muted-foreground">Tài khoản của bạn</p>
                            <p className="mt-1 break-words text-sm font-semibold">{displayName}</p>
                        </div>
                        <Menu.Separator className="mx-2 mb-1 h-px bg-border" />
                        <Menu.LinkItem render={<Link to="/account/profile" />} closeOnClick className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-accent">
                            <UserRound aria-hidden="true" className="size-4" />Hồ sơ tài khoản
                        </Menu.LinkItem>
                        <Menu.LinkItem render={<Link to="/account/orders" />} closeOnClick className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-accent">
                            <Package aria-hidden="true" className="size-4" />Đơn hàng của tôi
                        </Menu.LinkItem>
                        <Menu.LinkItem render={<Link to="/account/wishlist" />} closeOnClick className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-accent">
                            <Heart aria-hidden="true" className="size-4" />Sản phẩm yêu thích
                        </Menu.LinkItem>
                        <Menu.Separator className="mx-2 my-1 h-px bg-border" />
                        <Menu.Item disabled={logoutMutation.isPending} closeOnClick={false} onClick={handleLogout} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-destructive outline-none data-[highlighted]:bg-destructive/10 data-[disabled]:opacity-50">
                            <LogOut aria-hidden="true" className="size-4" />
                            {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                        </Menu.Item>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    )
}
