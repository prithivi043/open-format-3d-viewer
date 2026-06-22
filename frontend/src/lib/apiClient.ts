export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  // prevent duplicate /v1
  if (normalized.startsWith("/v1/")) {
    normalized = normalized.replace("/v1", "");
  }

  let url: string;

  if (import.meta.env.DEV) {
    // localhost → use vite proxy
    url = `/v1${normalized}`;
  } else {
    // vercel production → call backend directly
    url = `${BASE_URL}${normalized}`;
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
