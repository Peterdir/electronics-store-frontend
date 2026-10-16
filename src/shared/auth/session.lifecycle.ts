import { queryClient } from "../api/queryClient";
import { authEvents } from "./auth.events";
import { decodeJwt, isExpired } from "./jwt";
import { useSession } from "./session.store";

const SESSION_STORAGE_KEY = "ec.session";
const WARNING_WINDOW_MS = 60_000;

// Giữ trạng thái qua lần React StrictMode chạy lại effect trong dev.
let lastWarnedToken: string | null = null;

export function startSessionLifecycle(): () => void {
  let warningTimer: number | undefined;
  let expirationTimer: number | undefined;

  function clearTimers() {
    if (warningTimer !== undefined) {
      window.clearTimeout(warningTimer);
      warningTimer = undefined;
    }

    if (expirationTimer !== undefined) {
      window.clearTimeout(expirationTimer);
      expirationTimer = undefined;
    }
  }

  function emitWarningIfCurrent(token: string) {
    if (
      useSession.getState().token !== token ||
      lastWarnedToken === token
    ) {
      return;
    }

    lastWarnedToken = token;
    authEvents.emit({ type: "session-expiring" });
  }

  function expireIfCurrent(token: string) {
    if (useSession.getState().token === token) {
      useSession.getState().clear({ reason: "expired" });
    }
  }

  function scheduleSession(token: string | null) {
    clearTimers();

    if (!token) {
      return;
    }

    const expiration = decodeJwt(token)?.exp;

    if (typeof expiration !== "number") {
      expireIfCurrent(token);
      return;
    }

    const expiresAt = expiration * 1000;
    const expirationDelay = expiresAt - Date.now();

    if (expirationDelay <= 0) {
      expireIfCurrent(token);
      return;
    }

    const warningDelay = expirationDelay - WARNING_WINDOW_MS;

    if (warningDelay <= 0) {
      emitWarningIfCurrent(token);
    } else {
      warningTimer = window.setTimeout(() => {
        emitWarningIfCurrent(token);
      }, warningDelay);
    }

    expirationTimer = window.setTimeout(() => {
      expireIfCurrent(token);
    }, expirationDelay);
  }

  const unsubscribeSession = useSession.subscribe((state, previousState) => {
    if (state.token !== previousState.token) {
      scheduleSession(state.token);
    }
  });

  async function handleStorage(event: StorageEvent) {
    if (event.storageArea !== window.localStorage) {
      return;
    }

    if (event.key !== SESSION_STORAGE_KEY && event.key !== null) {
      return;
    }

    const previousToken = useSession.getState().token;

    await useSession.persist.rehydrate();

    const currentToken = useSession.getState().token;

    if (previousToken === currentToken) {
      return;
    }

    queryClient.clear();

    if (previousToken && !currentToken) {
      const reason = isExpired(previousToken) ? "expired" : "logout";

      // Rehydrate cập nhật store trực tiếp, không đi qua clear() trong session.store.
      // Vì vậy tab này tự phát đúng một sự kiện cho lần chuyển sang trạng thái đã xóa.
      authEvents.emit({ type: "session-cleared", reason });
    }
  }

  window.addEventListener("storage", handleStorage);
  scheduleSession(useSession.getState().token);

  return () => {
    clearTimers();
    unsubscribeSession();
    window.removeEventListener("storage", handleStorage);
  };
}