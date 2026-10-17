import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "./PasswordInput"
import {
    loginSchema,
    type LoginFormValues,
} from "@/features/auth/schemas"

export function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function handleValidSubmit() {
        // A4 sẽ nối request đăng nhập tại đây.
    }

    return (
        <form
            noValidate
            onSubmit={handleSubmit(handleValidSubmit)}
            className="mt-6 space-y-4"
        >
            <div className="space-y-2">
                <label
                    htmlFor="login-email"
                    className="block text-sm font-medium"
                >
                    Email
                </label>

                <input
                    {...register("email")}
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="user@gmail.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                        errors.email ? "login-email-error" : undefined
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {errors.email && (
                    <p
                        id="login-email-error"
                        role="alert"
                        className="text-sm text-destructive"
                    >
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="login-password"
                    className="block text-sm font-medium"
                >
                    Mật khẩu
                </label>

                <PasswordInput
                    {...register("password")}
                    id="login-password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                        errors.password ? "login-password-error" : undefined
                    }
                />

                {errors.password && (
                    <p
                        id="login-password-error"
                        role="alert"
                        className="text-sm text-destructive"
                    >
                        {errors.password.message}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full">
                Đăng nhập
            </Button>

            {isSubmitSuccessful && (
                <p role="status" className="text-sm text-muted-foreground">
                    Lần kiểm tra gần nhất: dữ liệu hợp lệ.
                    Chưa gửi yêu cầu đăng nhập.
                </p>
            )}

            <p className="text-sm text-muted-foreground">
                Form hiện chỉ kiểm tra dữ liệu, chưa kết nối máy chủ.
            </p>
        </form>
    )
}