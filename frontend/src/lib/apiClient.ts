export const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/me",
  "/auth/logout",
  "/auth/refresh",
  "/auth/google",
];

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const isFormData = options.body instanceof FormData;

  if (method !== "GET" && method !== "HEAD" && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  let normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (normalized.startsWith("/v1/")) {
    normalized = normalized.replace("/v1", "");
  }

  const isAuthEndpoint = AUTH_ENDPOINTS.some(
    (path) => normalized === path || normalized.startsWith(`${path}/`),
  );

  let url: string;

  if (import.meta.env.DEV) {
    url = `/v1${normalized}`;
  } else {
    if (isAuthEndpoint) {
      // auth → direct backend
      url = `${BASE_URL}${normalized}`;
    } else {
      // projects/models → via vercel proxy
      url = `/v1${normalized}`;
    }
  }

  console.log("API URL:", url);

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      err?.error?.message ?? err?.detail ?? `Request failed (${res.status})`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();
  return json?.data ?? json;
}
