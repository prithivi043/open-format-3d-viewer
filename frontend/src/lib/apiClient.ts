import { isMockModeActive, handleMockRequest } from "./mockApi";

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

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!import.meta.env.DEV && !BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

function buildUrl(endpoint: string) {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (import.meta.env.DEV) {
    return `/v1${normalized}`;
  }

  const cleanBase = BASE_URL.endsWith("/v1") ? BASE_URL.slice(0, -3) : BASE_URL;

  return `${cleanBase}/v1${normalized}`;
}

async function refreshToken() {
  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  return response.ok;
}

function extractErrorMessage(data: unknown, status: number): string {
  const err = data as any;

  if (err?.error?.code === "INTERNAL_ERROR") {
    return "The server is currently unavailable. Please try again later.";
  }

  if (Array.isArray(err?.detail)) {
    return err.detail.map((d: any) => d?.msg ?? String(d)).join(", ");
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

  const requestUrl = buildUrl(endpoint);

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

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

  let data: any = null;

  try {
    data = await response.json();
  } catch {}

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
