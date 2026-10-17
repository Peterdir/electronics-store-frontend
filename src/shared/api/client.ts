import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import { normalizeError } from "./errors";

// Mở rộng kiểu config để feature có thể chặn public retry.
declare module "axios" {
  interface AxiosRequestConfig {
    meta?: { noPublicRetry?: boolean };
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

  // Header này chỉ dùng nội bộ, không gửi sang backend.
  config.headers.delete("X-Skip-Auth");

  const token = useSession.getState().token;

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
    // Giữ nguyên lỗi hủy request.
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
        const newToken = original._retry ? null : await refreshOnce();

        // Trong lúc chờ, người dùng có thể đã đăng nhập phiên mới.
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

    throw await normalizeError(error);
  },
);