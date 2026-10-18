import { LoginForm } from "@/features/auth/components/LoginForm"
import { Link } from "react-router"

export function LoginPage() {
    return (
        <div className="flex items-center justify-center">
            <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                <h1 className="text-2xl font-bold">
                    Đăng nhập
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Sử dụng email và mật khẩu của bạn
                </p>

                <LoginForm />

                <p className="mt-6 text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link to="/register" className="text-primary underline">
                        Đăng ký
                    </Link>
                </p>
            </section>
        </div>
    )
}