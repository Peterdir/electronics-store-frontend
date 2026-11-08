import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useMe } from "@/features/auth/queries"
import { isExpired } from "@/shared/auth/jwt"
import { useSession } from "@/shared/auth/session.store"
import { ProfileForm } from "../components/ProfileForm"

export function ProfilePage() {
    const token = useSession((state) => state.token)
    const userId = useSession((state) => state.user?.id)
    const profileQuery = useMe()

    const hasSession = Boolean(userId && token && !isExpired(token))
    const profile = profileQuery.data?.id === userId ? profileQuery.data : undefined

    return (
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold">
                Hồ sơ tài khoản
            </h1>

            {!hasSession && (
                <div className="mt-6 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Bạn cần đăng nhập để xem hồ sơ.
                    </p>

                    <Link
                        to="/login"
                        className="text-sm font-medium text-primary underline underline-offset-4"
                    >
                        Đăng nhập
                    </Link>
                </div>
            )}

            {hasSession && !profile && profileQuery.isPending && (
                <p
                    role="status"
                    className="mt-6 text-sm text-muted-foreground"
                >
                    Đang tải hồ sơ...
                </p>
            )}

            {hasSession && profileQuery.isError && (
                <div className="mt-6 space-y-3">
                    <p role="alert" className="text-sm text-destructive">
                        {profileQuery.error.message}
                    </p>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={profileQuery.isFetching}
                        onClick={() => {
                            void profileQuery.refetch()
                        }}
                    >
                        {profileQuery.isFetching
                            ? "Đang thử lại..."
                            : "Thử lại"}
                    </Button>
                </div>
            )}

            {hasSession && profile && (
                <ProfileForm
                    key={profile.id}
                    profile={profile}
                    onReloadProfile={async () => {
                        const result = await profileQuery.refetch({ throwOnError: true })
                        if (!result.data) throw new Error("Chưa tải được hồ sơ.")
                        return result.data
                    }}
                />
            )}
        </section>
    )
}
