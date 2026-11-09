import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { ApiError, normalizeError } from "./errors";

declare module "axios" {
  interface AxiosRequestConfig {
    meta?: { 
      noPublicRetry?: boolean
      authToken?: string
      checkoutSession?: { userId: string | null; token: string | null }
    };
  }
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const PUBLIC_TREES = [
  "/api/products",
  "/api/categories",
  "/api/brands",
  "/api/policies",
  "/api/auth",
  "/api/payments/vnpay",
] as const;

function isPublicEndpoint(config: InternalAxiosRequestConfig): boolean {
  const pathname = new URL(
    config.url ?? "",
    window.location.origin,
  ).pathname;

  return (
    PUBLIC_TREES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    (config.method?.toUpperCase() === "POST" &&
      pathname === "/api/orders/checkout")
  );
}

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const skipAuth = config.headers.get("X-Skip-Auth") === "1";

  config.headers.delete("X-Skip-Auth");

  const checkoutSession = config.meta?.checkoutSession;
  if (checkoutSession) {
    const current = useSession.getState();
    const matches = checkoutSession.userId === null
      ? !checkoutSession.token && !current.token && !current.user
      : Boolean(checkoutSession.token && !isExpired(checkoutSession.token) &&
          current.token === checkoutSession.token && current.user?.id === checkoutSession.userId);
    if (!matches || skipAuth) {
      throw new ApiError(401, "Phiên mua hàng đã thay đổi. Hãy bắt đầu lại checkout.");
    }
  }

  const token = config.meta?.authToken ?? useSession.getState().token;

  if (skipAuth || !token || isExpired(token)) {
    config.headers.delete("Authorization");
  } else {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  return null; // Backend hiện chưa có refresh endpoint.
}

let refreshPromise: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof ApiError) throw error;
    if (axios.isCancel(error)) throw error;

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config
    ) {
      const original = error.config as RetryConfig;
      const authorization = original.headers.get("Authorization");

      const sentToken =
        typeof authorization === "string" &&
        authorization.startsWith("Bearer ")
          ? authorization.slice(7)
          : null;

      if (sentToken && useSession.getState().token === sentToken) {
        const newToken = original._retry || original.meta?.checkoutSession
          ? null
          : await refreshOnce();

        if (useSession.getState().token === sentToken) {
          if (newToken) {
            useSession.getState().setToken(newToken);
            original._retry = true;
            original.headers.set("Authorization", `Bearer ${newToken}`);
            return api(original);
          }

          useSession.getState().clear({ reason: "expired" });
        }
      }

      if (
        sentToken &&
        !original._retry &&
        !original.meta?.noPublicRetry &&
        isPublicEndpoint(original)
      ) {
        original._retry = true;
        original.headers.delete("Authorization");
        original.headers.set("X-Skip-Auth", "1");
        return api(original);
      }
    }

    const normalized = await normalizeError(error);

    const isLocked = normalized.status === 400 &&
      (
        normalized.message ===
          "This account has been locked. Please contact support" ||
        normalized.message ===
          "This account has been locked. Please contact support."
      );

    if (
      isLocked &&
      axios.isAxiosError(error) &&
      error.config
    ) {
      const authorization = error.config.headers.get("Authorization");

      const sentToken =
        typeof authorization === "string" &&
        authorization.startsWith("Bearer ")
          ? authorization.slice(7)
          : null;

      if (
        sentToken &&
        useSession.getState().token === sentToken
      ) {
        useSession.getState().clear({ reason: "locked" });
      }
    }

    throw normalized;
  },
);
