import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import type { CheckoutSession } from "./types";

export function isCheckoutSessionCurrent(expected: CheckoutSession): boolean {
  const current = useSession.getState();
  return expected.userId === null
    ? expected.token === null && !current.token && !current.user
    : Boolean(expected.token && !isExpired(expected.token) &&
        current.token === expected.token && current.user?.id === expected.userId);
}
