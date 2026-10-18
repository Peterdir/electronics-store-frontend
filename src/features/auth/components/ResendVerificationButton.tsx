import { useEffect, useState } from "react";
import { useResendVerification } from "../queries";
import { Button } from "@/components/ui/button"


interface ResendVerificationProps {
    email: string
}

export function ResendVerificationButton({
    email
}: ResendVerificationProps) {

    const resend = useResendVerification();
    const [cooldownUntil, setCooldownUntil] = useState(0)
    const [remainingSeconds, setRemainingSeconds] = useState(0)

    useEffect(() => {
        if (cooldownUntil === 0) {
            return;
        }

        const timer = window.setInterval(() => {
            const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

            setRemainingSeconds(remaining);

            if (remaining === 0) {
                window.clearInterval(timer);
            }
        }, 250);

        return () => window.clearInterval(timer);
    }, [cooldownUntil]);

    function handleResend() {
        if (!email.trim() ||
            resend.isPending ||
            remainingSeconds > 0
        ) {
            return;
        }

        resend.mutate(email, {
            onSuccess: () => {
                setCooldownUntil(Date.now() + 60_000);
                setRemainingSeconds(60);
            }
        })
    }

    return (
        <div className="space-y-3">
            <Button
                type="button"
                className="w-full"
                variant="outline"
                disabled={
                    !email.trim() ||
                    resend.isPending ||
                    remainingSeconds > 0
                }
                onClick={handleResend}
            >
                {resend.isPending
                    ? "Đang gửi..."
                    : remainingSeconds > 0
                    ? `Gửi lại sau ${remainingSeconds} giây` 
                    : "Gửi lại email xác thực"
                }
            </Button>

            {resend.isSuccess && (
                <p role="status" className="text-sm text-muted-foreground">
                    {resend.data.message}
                </p>
            )}

            {resend.isError && (
                <p role="alert" className="text-sm text-destructive">
                    {resend.error.message ||
                        "Không thể gửi lại email. Vui lòng thử lại."}
                </p>
            )}
        </div>
    )
}