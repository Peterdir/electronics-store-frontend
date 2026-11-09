import { useSession } from "@/shared/auth/session.store"
import { ChangePasswordForm } from "../components/ChangePasswordForm"

export function ChangePasswordPage() {
    const userId = useSession((state) => state.user?.id)

    return (
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>

            <p className="mt-2 text-sm text-muted-foreground">
                Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản.
            </p>

            {userId && (
                <ChangePasswordForm key={userId} userId={userId} />
            )}
        </section>
    )
}