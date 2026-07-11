import { isMockModeActive, handleMockRequest } from "./mockApi";
import { useAuthStore } from "../features/auth/store/authStore";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  retry?: boolean;
};

export type ApiResponse<T> = {
  data: T;
  meta?: unknown;
};

// Always use relative paths so:
// - In development: Vite's dev-server proxy (vite.config.ts) forwards /v1/* → Render
// - In production (Vercel): vercel.json rewrites forward /v1/* → Render
// This avoids cross-origin CORS preflight OPTIONS requests, which Render
// rejects with 401 Unauthorized before the actual request can even be made.
function buildUrl(endpoint: string): string {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `/v1${normalized}`;
}

async function refreshToken() {
  try {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const json = await response.json();
      const payload =
        json && typeof json === "object" && "data" in json ? json.data : json;
      if (payload?.access_token) {
        useAuthStore.getState().setAccessToken(payload.access_token);
      }
      return true;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }

  useAuthStore.getState().logout();
  return false;
}

interface ApiErrorShape {
  error?: { code?: string; message?: string };
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

function extractErrorMessage(data: unknown, status: number): string {
  const err = data as ApiErrorShape;

  if (err?.error?.code === "INTERNAL_ERROR") {
    return "The server is currently unavailable. Please try again later.";
  }

  if (Array.isArray(err?.detail)) {
    return err.detail.map((d) => d?.msg ?? String(d)).join(", ");
  }

  if (typeof err?.detail === "string") {
    return err.detail;
  }

  if (typeof err?.message === "string") return err.message;
  if (typeof err?.error?.message === "string") return err.error.message;

  return `Request failed (${status})`;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, retry = true } = options;

  if (isMockModeActive()) {
    return handleMockRequest(endpoint, options) as Promise<T>;
  }

  const requestUrl = requestUrlHelper(endpoint);

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    (requestHeaders as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: requestHeaders,
  };

  if (body) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(requestUrl, fetchOptions);

  if (response.status === 401 && retry) {
    const refreshed = await refreshToken();

    if (refreshed) {
      return apiClient<T>(endpoint, {
        ...options,
        retry: false,
      });
    }
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    // Ignore JSON parsing errors for empty/non-JSON responses
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, response.status);

    if (import.meta.env.DEV) {
      console.error("API ERROR:", {
        endpoint,
        status: response.status,
        response: data,
      });
    }

    throw new Error(message);
  }

  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

function requestUrlHelper(endpoint: string): string {
  return buildUrl(endpoint);
}
