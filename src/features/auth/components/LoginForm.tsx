import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "./PasswordInput"
import {
    loginSchema,
    type LoginFormValues,
} from "@/features/auth/schemas"
import { useLogin } from "@/features/auth/queries"
import { ApiError } from "@/shared/api/errors"

function getLoginErrorMessage(error: Error): string {
    if (error instanceof ApiError) {
        if (error.message.includes("not verified yet")) {
            return "Tài khoản chưa xác thực. Vui lòng kiểm tra email."
        }

        if (error.message.includes("locked")) {
            return "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ."
        }

        if (
            error.status === 404 ||
            (
                error.status === 400 &&
                error.message === "Invalid email or password."
            )
        ) {
            return "Email hoặc mật khẩu không đúng."
        }
    }

    return error.message || "Đăng nhập thất bại. Vui lòng thử lại."
}

export function LoginForm() {
    const loginMutation = useLogin()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function handleValidSubmit(values: LoginFormValues) {
        if (loginMutation.isPending) return

        loginMutation.mutate(values)
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

            <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
            >
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            {loginMutation.error && (
                <p role="alert" className="text-sm text-destructive">
                    {getLoginErrorMessage(loginMutation.error)}
                </p>
            )}

            {loginMutation.isSuccess && (
                <p role="status" className="text-sm text-muted-foreground">
                    Backend đã xác thực tài khoản {loginMutation.data.user.email}.
                    Bước này chưa lưu phiên đăng nhập.
                </p>
            )}
        </form>
    )
}