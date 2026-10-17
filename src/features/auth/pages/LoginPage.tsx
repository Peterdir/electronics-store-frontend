import { LoginForm } from "@/features/auth/components/LoginForm"

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
            </section>
        </div>
    )
}