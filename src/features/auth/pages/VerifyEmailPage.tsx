import { Link, useNavigate, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { getLoginDestination } from "@/shared/auth/redirect"
import { useVerifyEmail } from "../queries"

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")?.trim() ?? ""

    return <VerificationContent key={token} token={token} />
}

function VerificationContent({ token }: { token: string }) {
    const navigate = useNavigate()
    const verification = useVerifyEmail()

    function handleVerify() {
        if (
            !token ||
            verification.isPending ||
            verification.isSuccess
        ) {
            return
        }

        verification.mutate(token, {
            onSuccess: (data) => {
                navigate(
                    getLoginDestination(data.user.role),
                    { replace: true },
                )
            },
        })
    }

    const errorMessage =
        verification.error instanceof ApiError &&
        verification.error.message ===
            "This link has expired or is invalid."
            ? "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng."
            : verification.error?.message ||
                "Không thể xác thực email. Vui lòng thử lại."

    return (
        <section className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-bold">
                Xác thực email
            </h1>

            {!token ? (
                <p role="alert" className="text-sm text-destructive">
                    Liên kết thiếu mã xác thực.
                    Vui lòng mở đầy đủ liên kết trong email.
                </p>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        Bấm xác thực để kích hoạt và đăng nhập
                        vào tài khoản gắn với liên kết này.
                    </p>

                    <Button
                        type="button"
                        className="w-full"
                        disabled={
                            verification.isPending ||
                            verification.isSuccess
                        }
                        onClick={handleVerify}
                    >
                        {verification.isPending
                            ? "Đang xác thực..."
                            : verification.isSuccess
                                ? "Đã xác thực"
                                : "Xác thực email"}
                    </Button>

                    {verification.isError && (
                        <p role="alert" className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                </>
            )}

            <p className="text-sm text-muted-foreground">
                Nếu tài khoản chưa xác thực, hãy thử đăng nhập
                để mở tùy chọn gửi lại email.
            </p>

            <Link
                to="/login"
                className="text-sm text-primary underline"
            >
                Đến trang đăng nhập
            </Link>
        </section>
    )
}