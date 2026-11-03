import { useState, type ComponentProps } from "react"
import { Button } from "@/components/ui/button"

interface PasswordInputProps extends ComponentProps<"input"> {
    id: string;
    autoComplete?: string;
}

export function PasswordInput({
    id,
    autoComplete = "current-password",
    ...inputProps
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    function handleToggle() {
        setShowPassword((previous) => !previous);
    }

    return (
        <div className="relative">
            <input
                {...inputProps}
                id={id}
                type={showPassword ? "text" : "password"}
                autoComplete={autoComplete}
                className="form-control pr-20"
            />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-controls={id}
                className="absolute right-1 top-1/2 -translate-y-1/2"
            >
                {showPassword ? "Ẩn" : "Hiện"}
            </Button>
        </div>
    )
}
