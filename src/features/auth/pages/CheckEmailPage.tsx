import { Link, useLocation } from "react-router"

export function CheckEmailPage() {
    const location = useLocation()
    const state = location.state as {
        email?: unknown
        message?: unknown
    } | null

    const email = typeof state?.email === "string"
        ? state.email
        : ""

    const message = typeof state?.message === "string"
        ? state.message
        : ""

    return (
        <section className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-bold">Kiểm tra email</h1>

            {email ? (
                <>
                    <p className="text-sm">
                        Mở hộp thư của{" "}
                        <strong className="break-all">{email}</strong>{" "}
                        và làm theo liên kết xác thực.
                    </p>

                    {message && (
                        <p role="status" className="text-sm text-muted-foreground">
                            {message}
                        </p>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Nếu chưa thấy email, hãy kiểm tra thư mục spam.
                    </p>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Trang này không có thông tin email vừa đăng ký.
                    Nếu đã đăng ký, hãy kiểm tra hộp thư của bạn.
                </p>
            )}

            <div className="flex gap-4 text-sm">
                <Link to="/login" className="text-primary underline">
                    Đăng nhập
                </Link>

                <Link to="/register" className="text-primary underline">
                    Quay lại đăng ký
                </Link>
            </div>
        </section>
    )
}