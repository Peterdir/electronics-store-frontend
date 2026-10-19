import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { useSession } from "@/shared/auth/session.store"
import { PasswordInput } from "../components/PasswordInput"
import { useLogout, useResetPassword } from "../queries"
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas"

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")?.trim() ?? ""
    return <ResetPasswordContent key={token} token={token} />
}

function ResetPasswordContent({ token }: { token: string }) {
    const reset = useResetPassword()
    const logout = useLogout()
    const sessionToken = useSession((state) => state.token)
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    })

    function onSubmit(values: ResetPasswordFormValues) {
        if (!token || reset.isPending || reset.isSuccess) return
        clearErrors()
        reset.mutate({ token, ...values }, {
            onError: (error) => {
                if (error instanceof ApiError) {
                    let fieldError = false
                    for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
                        if (field === "newPassword" || field === "confirmPassword") {
                            setError(field, { type: "server", message })
                            fieldError = true
                        }
                    }
                    if (fieldError) return
                }
                setError("root.server", {
                    message: error.message === "This link has expired or is invalid."
                        ? "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Hãy yêu cầu liên kết mới."
                        : error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
                })
            },
        })
    }

    function handleRelogin() {
        if (!sessionToken || logout.isPending) return
        logout.mutate(sessionToken, {
            onSettled: () => navigate("/login", { replace: true }),
        })
    }

    return (
        <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
            {!token ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                    Liên kết thiếu mã đặt lại mật khẩu. Hãy yêu cầu liên kết mới.
                </p>
            ) : reset.isSuccess ? (
                <div className="mt-4 space-y-4">
                    <p role="status" className="text-sm">Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.</p>
                    {sessionToken ? (
                        <Button 
                            type="button" 
                            onClick={handleRelogin} 
                            disabled={logout.isPending}
                        >
                            {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất và đăng nhập lại"}
                        </Button>
                    ) : (
                        <Link to="/login" className="text-sm text-primary underline">Đến trang đăng nhập</Link>
                    )}
                </div>
            ) : (
                <form 
                    noValidate 
                    onSubmit={handleSubmit(onSubmit)} 
                    className="mt-6 space-y-4"
                >
                    <fieldset 
                        disabled={reset.isPending} 
                        className="space-y-4"
                    >
                        {(["newPassword", "confirmPassword"] as const).map((name) => (
                            <div key={name} className="space-y-2">
                                <label htmlFor={`reset-${name}`} className="block text-sm font-medium">
                                    {name === "newPassword" ? "Mật khẩu mới" : "Xác nhận mật khẩu"}
                                </label>
                                <PasswordInput
                                    {...register(name)}
                                    id={`reset-${name}`}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(errors[name])}
                                    aria-describedby={errors[name] ? `reset-${name}-error` : undefined}
                                />
                                {errors[name] && (
                                    <p id={`reset-${name}-error`} role="alert" className="text-sm text-destructive">
                                        {errors[name]?.message}
                                    </p>
                                )}
                            </div>
                        ))}
                        <p className="text-sm text-muted-foreground">
                            Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự @#$%^&amp;+=.
                        </p>
                        <Button type="submit" className="w-full">
                            {reset.isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                        </Button>
                    </fieldset>
                    {errors.root?.server && (
                        <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>
                    )}
                </form>
            )}
            <div className="mt-6 flex gap-4 text-sm">
                <Link to="/forgot-password" className="text-primary underline">Yêu cầu liên kết mới</Link>
                {!sessionToken && <Link to="/login" className="text-primary underline">Đăng nhập</Link>}
            </div>
        </section>
    )
}
