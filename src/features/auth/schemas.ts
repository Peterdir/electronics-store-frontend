import { z } from "zod"

// LOGIN
export const loginSchema = z.object({
    email: z.email("Email không hợp lệ."),
    password: z.string().min(1, "Vui lòng nhập mật khẩu."),
})

export type LoginFormValues = z.infer<typeof loginSchema>


// REGISTER
export const newPasswordSchema = z.string().regex(
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$/,
    "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự @#$%^&+=.",
)

export const registerSchema = z.object({
    email: z.email("Email không hợp lệ."),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
}).refine(
    (values) => values.password === values.confirmPassword,
    {
        message: "Mật khẩu xác nhận không khớp.",
        path: ["confirmPassword"],
    },
)

export type RegisterFormValues = z.infer<typeof registerSchema>


// FORGOT PASSWORD
export const forgotPasswordSchema = z.object({
    email: z.email("Email không hợp lệ."),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>


// RESET PASSWORD
export const resetPasswordSchema = z.object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
}).refine(
    (values) => values.newPassword === values.confirmPassword,
    {
        message: "Mật khẩu xác nhận không khớp.",
        path: ["confirmPassword"],
    },
)

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>


export const profileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập họ và tên."),

    phone: z
        .string()
        .trim()
        .refine(
            (value) =>
                value === "" ||
                /^(0|\+84)[0-9]{9}$/.test(value),
            "Số điện thoại phải có dạng 0912345678 hoặc +84912345678.",
        ),
})

export type ProfileFormValues = z.infer<typeof profileSchema>