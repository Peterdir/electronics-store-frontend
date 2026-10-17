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
                className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-20 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" 
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
