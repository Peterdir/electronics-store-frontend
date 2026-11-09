import { useEffect, useId, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { useSession } from "@/shared/auth/session.store"
import { PasswordInput } from "./PasswordInput"
import {
    isCurrentPasswordSession,
    useChangePassword,
} from "../queries"
import {
    changePasswordSchema,
    type ChangePasswordFormValues,
} from "../schemas"

const fields = [
    {
        name: "currentPassword",
        label: "Mật khẩu hiện tại",
        autoComplete: "current-password",
    },
    {
        name: "newPassword",
        label: "Mật khẩu mới",
        autoComplete: "new-password",
    },
    {
        name: "confirmPassword",
        label: "Xác nhận mật khẩu mới",
        autoComplete: "new-password",
    },
] as const

export function ChangePasswordForm({ userId }: { userId: string }) {
    const id = useId()
    const mutation = useChangePassword()
    const mounted = useRef(false)
    const submitting = useRef(false)

    const {
        register,
        handleSubmit,
        reset,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    async function onSubmit(values: ChangePasswordFormValues) {
        if (submitting.current) return

        const session = useSession.getState()
        if (!session.token || session.user?.id !== userId) return

        const variables = {
            userId,
            token: session.token,
            payload: values,
        }

        if (!isCurrentPasswordSession(variables)) return

        const canApply = () => mounted.current && isCurrentPasswordSession(variables)

        submitting.current = true
        clearErrors()

        try {
            const result = await mutation.mutateAsync(variables)
            if (!result || !canApply()) return

            reset()
            toast.success("Đổi mật khẩu thành công.")
        } catch (error) {
            if (!canApply()) return

            if (
                error instanceof ApiError &&
                error.message === "Incorrect current password."
            ) {
                setError("currentPassword", {
                    type: "server",
                    message: "Mật khẩu hiện tại không đúng.",
                }, { shouldFocus: true })
                return
            }

            if (error instanceof ApiError && error.isValidation) {
                const otherMessages: string[] = []

                for (const [field, message] of Object.entries(
                    error.fieldErrors ?? {},
                )) {
                    if (
                        field === "currentPassword" ||
                        field === "newPassword" ||
                        field === "confirmPassword"
                    ) {
                        setError(field, { type: "server", message })
                    } else {
                        otherMessages.push(message)
                    }
                }

                if (otherMessages.length) {
                    setError("root.server", {
                        message: otherMessages.join(" "),
                    })
                }
                return
            }

            setError("root.server", {
                message: error instanceof Error
                    ? error.message
                    : "Không thể đổi mật khẩu. Vui lòng thử lại.",
            })
        } finally {
            submitting.current = false
            if (mounted.current) mutation.reset()
        }
    }

    const busy = isSubmitting || mutation.isPending

    return (
        <form
            noValidate
            onSubmit={(event) => { void handleSubmit(onSubmit)(event) }}
            className="mt-6 space-y-5"
            aria-busy={busy}
        >
            <fieldset disabled={busy} className="space-y-5">
                <legend className="sr-only">Đổi mật khẩu</legend>

                {fields.map(({ name, label, autoComplete }) => {
                    const fieldId = `${id}-${name}`
                    const error = errors[name]
                    const describedBy = [
                        name === "newPassword" ? `${id}-help` : "",
                        error ? `${fieldId}-error` : "",
                    ].filter(Boolean).join(" ") || undefined

                    return (
                        <div key={name} className="space-y-2">
                            <label
                                htmlFor={fieldId}
                                className="block text-sm font-medium"
                            >
                                {label}
                            </label>

                            <PasswordInput
                                {...register(name)}
                                id={fieldId}
                                required
                                autoComplete={autoComplete}
                                aria-invalid={Boolean(error)}
                                aria-describedby={describedBy}
                            />

                            {name === "newPassword" && (
                                <p
                                    id={`${id}-help`}
                                    className="text-sm text-muted-foreground"
                                >
                                    Ít nhất 8 ký tự, gồm chữ hoa, chữ thường,
                                    số và ký tự @#$%^&amp;+=.
                                </p>
                            )}

                            {error && (
                                <p
                                    id={`${fieldId}-error`}
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {error.message}
                                </p>
                            )}
                        </div>
                    )
                })}

                <Button type="submit" disabled={busy} className="min-h-11">
                    {busy ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
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