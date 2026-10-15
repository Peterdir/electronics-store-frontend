export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL?.trim() || undefined,
  BACKEND_ORIGIN:
    import.meta.env.VITE_BACKEND_ORIGIN?.trim() || "http://localhost:8080",
} as const;