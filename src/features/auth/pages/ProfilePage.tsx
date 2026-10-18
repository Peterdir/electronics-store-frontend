import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useMe } from "@/features/auth/queries"
import { isExpired } from "@/shared/auth/jwt"
import { useSession } from "@/shared/auth/session.store"

export function ProfilePage() {
    const token = useSession((state) => state.token)
    const profileQuery = useMe()

    const hasSession = Boolean(token && !isExpired(token))

    return (
        <section className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
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

            {hasSession && profileQuery.isPending && (
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

            {hasSession && profileQuery.isSuccess && (
                <div className="mt-6 space-y-6">
                    {!profileQuery.data.fullName && (
                        <p
                            role="status"
                            className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"
                        >
                            Bạn chưa có họ tên. Hãy hoàn thiện hồ sơ
                            khi tính năng chỉnh sửa được bổ sung.
                        </p>
                    )}

                    <dl className="space-y-4">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Email
                            </dt>
                            <dd className="mt-1 wrap-break-word font-medium">
                                {profileQuery.data.email}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Họ và tên
                            </dt>
                            <dd className="mt-1 font-medium">
                                {profileQuery.data.fullName || "Chưa cập nhật"}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Số điện thoại
                            </dt>
                            <dd className="mt-1 font-medium">
                                {profileQuery.data.phone || "Chưa cập nhật"}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </section>
    )
}