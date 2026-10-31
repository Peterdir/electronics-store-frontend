import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { queryClient } from "../shared/api/queryClient";
import { Toaster, toast } from "sonner";
import { authEvents } from "@/shared/auth/auth.events";
import { startSessionLifecycle } from "../shared/auth/session.lifecycle";
import { useSession } from "@/shared/auth/session.store";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

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
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
                    id: SESSION_EXPIRED_TOAST_ID,
                    duration: 2000,
                });
            }
        });

        const unsubscribeSession = useSession.subscribe((state, previousState) => {
            if (state.token && state.token !== previousState.token) {
                toast.dismiss(SESSION_EXPIRED_TOAST_ID);
            }
        });

        const stopSessionLifecycle = startSessionLifecycle();

        return () => {
            unsubscribeEvents();
            unsubscribeSession();
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
