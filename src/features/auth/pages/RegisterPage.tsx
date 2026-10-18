import { Link } from "react-router"
import { RegisterForm } from "../components/RegisterForm"

export function RegisterPage() {
    return (
        <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-bold">Tạo tài khoản</h1>

            <p className="mt-2 text-sm text-muted-foreground">
                Đăng ký bằng email và xác thực để bắt đầu sử dụng.
            </p>

            <RegisterForm />

            <p className="mt-6 text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-primary underline">
                    Đăng nhập
                </Link>
            </p>
        </section>
    )
}