import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { useForgotPassword } from "../queries"
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas"

export function ForgotPasswordPage() {
    const request = useForgotPassword()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    })

    function onSubmit(values: ForgotPasswordFormValues) {
        if (request.isPending) return
        clearErrors()
        request.mutate(values, {
            onError: (error) => {
                if (error instanceof ApiError && error.fieldErrors?.email) {
                    setError("email", { type: "server", message: error.fieldErrors.email })
                    return
                }
                setError("root.server", {
                    message: "Nếu email này đã đăng ký, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
                })
            },
        })
    }

    return (
        <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-bold">
                Quên mật khẩu
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
            </p>
            <form 
                noValidate 
                onSubmit={handleSubmit(onSubmit)} 
                className="mt-6 space-y-4"
            >
                <fieldset 
                    disabled={request.isPending} 
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label 
                            htmlFor="forgot-email" 
                            className="block text-sm font-medium"
                        >
                                Email
                        </label>
                        <input
                            {...register("email")}
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? "forgot-email-error" : undefined}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {errors.email && (
                            <p 
                                id="forgot-email-error" 
                                role="alert" 
                                className="text-sm text-destructive"
                            >
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full"
                    >
                        {request.isPending ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                    </Button>
                </fieldset>
                {errors.root?.server && (
                    <p 
                        role="alert" 
                        className="text-sm text-destructive"
                    >
                        {errors.root.server.message}
                    </p>
                )}
                {request.isSuccess && (
                    <p 
                        role="status" 
                        className="text-sm text-muted-foreground"
                    >
                        Yêu cầu đã được xử lý. Hãy kiểm tra hộp thư và thư mục spam để mở liên kết đặt lại mật khẩu.
                    </p>
                )}
            </form>
            <Link 
                to="/login" 
                className="mt-6 inline-block text-sm text-primary underline"
            >
                Quay lại đăng nhập
            </Link>
        </section>
    )
}
