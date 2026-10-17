import { Link } from "react-router"
import { useSession } from "@/shared/auth/session.store"

export function UserMenu() {
    const user = useSession((state) => state.user)

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
        <span
            title={user.email}
            className="max-w-48 truncate text-sm font-medium"
        >
            {user.email}
        </span>
    )
}