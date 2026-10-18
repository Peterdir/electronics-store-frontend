import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { useRegister } from "../queries"
import {
    registerSchema,
    type RegisterFormValues,
} from "../schemas"
import { PasswordInput } from "./PasswordInput"

const fields = [
    { name: "email", label: "Email" },
    { name: "password", label: "Mật khẩu" },
    { name: "confirmPassword", label: "Xác nhận mật khẩu" },
] as const

export function RegisterForm() {
    const navigate = useNavigate()
    const registration = useRegister()

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    function handleValidSubmit(values: RegisterFormValues) {
        if (registration.isPending) return

        clearErrors()

        registration.mutate(values, {
            onSuccess: (data) => {
                reset()

                navigate("/register/check-email", {
                    replace: true,
                    state: {
                        email: values.email,
                        message: data.message,
                    },
                })
            },
            onError: (error) => {
                if (error instanceof ApiError) {
                    if (error.status === 409) {
                        setError("email", {
                            type: "server",
                            message: "Email này đã được đăng ký.",
                        })
                        return
                    }

                    const fieldErrors = Object.entries(
                        error.fieldErrors ?? {},
                    )

                    if (fieldErrors.length > 0) {
                        const otherMessages: string[] = []

                        for (const [field, message] of fieldErrors) {
                            if (
                                field === "email" ||
                                field === "password" ||
                                field === "confirmPassword"
                            ) {
                                setError(field, {
                                    type: "server",
                                    message,
                                })
                            } else {
                                otherMessages.push(message)
                            }
                        }

                        if (otherMessages.length > 0) {
                            setError("root.server", {
                                message: otherMessages.join(" "),
                            })
                        }

                        return
                    }
                }

                setError("root.server", {
                    message:
                        error.message ||
                        "Đăng ký thất bại. Vui lòng thử lại.",
                })
            },
        })
    }

    return (
        <form
            noValidate
            onSubmit={handleSubmit(handleValidSubmit)}
            className="mt-6 space-y-4"
        >
            <fieldset
                disabled={registration.isPending}
                className="space-y-4"
            >
                {fields.map(({ name, label }) => {
                    const id = `register-${name}`
                    const error = errors[name]

                    const inputProps = {
                        ...register(name),
                        id,
                        "aria-invalid": Boolean(error),
                        "aria-describedby": error
                            ? `${id}-error`
                            : undefined,
                    }

                    return (
                        <div key={name} className="space-y-2">
                            <label
                                htmlFor={id}
                                className="block text-sm font-medium"
                            >
                                {label}
                            </label>

                            {name === "email" ? (
                                <input
                                    {...inputProps}
                                    type="email"
                                    autoComplete="email"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            ) : (
                                <PasswordInput
                                    {...inputProps}
                                    autoComplete="new-password"
                                />
                            )}

                            {error && (
                                <p
                                    id={`${id}-error`}
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {error.message}
                                </p>
                            )}
                        </div>
                    )
                })}

                <p className="text-sm text-muted-foreground">
                    Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa,
                    chữ thường, số và ký tự @#$%^&amp;+=.
                </p>

                <Button type="submit" className="w-full">
                    {registration.isPending
                        ? "Đang đăng ký..."
                        : "Đăng ký"}
                </Button>
            </fieldset>

            {errors.root?.server && (
                <p role="alert" className="text-sm text-destructive">
                    {errors.root.server.message}
                </p>
            )}
        </form>
    )
}