import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { queryClient } from "../shared/api/queryClient";
import { Toaster, toast } from "sonner";
import { authEvents } from "@/shared/auth/auth.events";
import { startSessionLifecycle } from "../shared/auth/session.lifecycle";

interface AppProvidersProps {
    children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
    useEffect(() => {
        const unsubscribeEvents = authEvents.subscribe((event) => {
            if (event.type === "session-expiring") {
                toast.warning(
                    "Phiên đăng nhập sẽ hết hạn trong khoảng 1 phút. Hãy lưu lại thao tác.",
                );
            }

            if (
                event.type === "session-cleared" &&
                event.reason === "expired"
            ) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            }
        });

        const stopSessionLifecycle = startSessionLifecycle();

        return () => {
            unsubscribeEvents();
            stopSessionLifecycle();
        };
    }, []);

    return (
        <QueryClientProvider client = {queryClient}>
            {children}
            <Toaster position="top-right" richColors />
        </QueryClientProvider>
    )
}