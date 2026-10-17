import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/queries"
import { useSession } from "@/shared/auth/session.store"

export function UserMenu() {
    const user = useSession((state) => state.user)
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
                className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                Đăng nhập
            </Link>
        )
    }

    return (
        <div className="flex min-w-0 items-center gap-3">
            <span
                title={user.email}
                className="max-w-48 truncate text-sm font-medium"
            >
                {user.email}
            </span>

            <Link
                to="/account/profile"
                className="shrink-0 rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                Tài khoản
            </Link>

            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
            >
                {logoutMutation.isPending
                    ? "Đang đăng xuất..."
                    : "Đăng xuất"}
            </Button>
        </div>
    )
}