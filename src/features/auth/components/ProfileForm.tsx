import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/errors"
import { useSession } from "@/shared/auth/session.store"
import { isCurrentProfileSession, useUpdateProfile } from "../queries"
import { profileSchema, type ProfileFormValues } from "../schemas"
import type { UserProfileResponse } from "../types"

interface ProfileFormProps {
    profile: UserProfileResponse
    onReloadProfile: () => Promise<UserProfileResponse>
}

const fields = [
    { name: "fullName", label: "Họ và tên", type: "text", autoComplete: "name" },
    { name: "phone", label: "Số điện thoại", type: "tel", autoComplete: "tel" },
] as const

type ProfileSession = { userId: string; token: string }

export function ProfileForm({ profile, onReloadProfile }: ProfileFormProps) {
    const id = useId()
    const updateMutation = useUpdateProfile()
    const mounted = useRef(false)
    const submitting = useRef(false)
    const [refreshSession, setRefreshSession] = useState<ProfileSession | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [refreshError, setRefreshError] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: profile.fullName ?? "",
            phone: profile.phone ?? "",
        },
    })

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    function canApply(session: ProfileSession) {
        return mounted.current && isCurrentProfileSession(session)
    }

    function acceptProfile(fresh: UserProfileResponse) {
        reset({ fullName: fresh.fullName ?? "", phone: fresh.phone ?? "" })
        setRefreshSession(null)
        setRefreshError(null)
        toast.success("Cập nhật hồ sơ thành công.")
    }

    async function handleValidSubmit(values: ProfileFormValues) {
        if (submitting.current || refreshSession) return

        const session = useSession.getState()
        if (!session.token || session.user?.id !== profile.id) return

        const variables = {
            userId: profile.id,
            token: session.token,
            payload: {
                fullName: values.fullName,
                ...(values.phone ? { phone: values.phone } : {}),
            },
        }

        submitting.current = true
        clearErrors()
        try {
            const result = await updateMutation.mutateAsync(variables)
            if (!result || !canApply(variables)) return

            if (!result.profile) {
                setRefreshSession(variables)
                return
            }

            acceptProfile(result.profile)
        } catch (error) {
            if (!canApply(variables)) return

            if (error instanceof ApiError && error.isValidation) {
                const otherMessages: string[] = []
                for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
                    if (field === "fullName" || field === "phone") {
                        setError(field, { type: "server", message })
                    } else {
                        otherMessages.push(message)
                    }
                }
                if (otherMessages.length) {
                    setError("root.server", { message: otherMessages.join(" ") })
                }
            } else {
                setError("root.server", {
                    message: error instanceof Error
                        ? error.message
                        : "Không thể lưu hồ sơ. Vui lòng thử lại.",
                })
            }
        } finally {
            submitting.current = false
        }
    }

    async function retryRefresh() {
        if (!refreshSession || submitting.current || !canApply(refreshSession)) return

        submitting.current = true
        setIsRefreshing(true)
        setRefreshError(null)
        try {
            const fresh = await onReloadProfile()
            if (!canApply(refreshSession)) return
            if (fresh.id !== refreshSession.userId) {
                throw new Error("Không thể xác nhận hồ sơ. Vui lòng tải lại trang.")
            }
            acceptProfile(fresh)
        } catch (error) {
            if (canApply(refreshSession)) {
                setRefreshError(error instanceof Error
                    ? error.message
                    : "Chưa tải lại được hồ sơ. Vui lòng thử lại.")
            }
        } finally {
            submitting.current = false
            if (mounted.current) setIsRefreshing(false)
        }
    }

    const busy = isSubmitting || updateMutation.isPending || isRefreshing

    return (
        <form
            noValidate
            onSubmit={(event) => { void handleSubmit(handleValidSubmit)(event) }}
            className="mt-6 space-y-5"
            aria-busy={busy}
        >
            <div className="space-y-2">
                <label htmlFor={`${id}-email`} className="block text-sm font-medium">Email</label>
                <input id={`${id}-email`} type="email" value={profile.email} readOnly
                    autoComplete="email" className="form-control" aria-describedby={`${id}-email-help`} />
                <p id={`${id}-email-help`} className="text-sm text-muted-foreground">Email đăng nhập chỉ được xem.</p>
            </div>

            <fieldset disabled={busy || Boolean(refreshSession)} className="space-y-5">
                <legend className="sr-only">Chỉnh sửa thông tin cá nhân</legend>
                {fields.map(({ name, label, type, autoComplete }) => {
                    const fieldId = `${id}-${name}`
                    const error = errors[name]
                    return (
                        <div key={name} className="space-y-2">
                            <label htmlFor={fieldId} className="block text-sm font-medium">
                                {label}{name === "phone" ? " (không bắt buộc)" : ""}
                            </label>
                            <input {...register(name)} id={fieldId} type={type} autoComplete={autoComplete}
                                required={name === "fullName"} className="form-control"
                                aria-invalid={Boolean(error)}
                                aria-describedby={[
                                    name === "phone" ? `${id}-phone-help` : "",
                                    error ? `${fieldId}-error` : "",
                                ].filter(Boolean).join(" ") || undefined} />
                            {name === "phone" && (
                                <p id={`${id}-phone-help`} className="text-sm text-muted-foreground">
                                    Ví dụ: 0912345678 hoặc +84912345678. Để trống để xóa số điện thoại đã lưu.
                                </p>
                            )}
                            {error && <p id={`${fieldId}-error`} role="alert" className="text-sm text-destructive">{error.message}</p>}
                        </div>
                    )
                })}
                <Button type="submit" disabled={busy || !isDirty} className="min-h-11">
                    {busy ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
            </fieldset>

            {errors.root?.server && (
                <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>
            )}

            {refreshSession && (
                <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
                    <p role="status" className="text-sm">
                        Hồ sơ đã được lưu nhưng chưa tải lại được thông tin. Hãy tải lại thông tin để tiếp tục chỉnh sửa.
                    </p>
                    {refreshError && <p role="alert" className="text-sm text-destructive">{refreshError}</p>}
                    <Button type="button" variant="outline" disabled={busy} className="min-h-11"
                        onClick={() => { void retryRefresh() }}>
                        {isRefreshing ? "Đang tải lại..." : "Tải lại thông tin"}
                    </Button>
                </div>
            )}
        </form>
    )
}
