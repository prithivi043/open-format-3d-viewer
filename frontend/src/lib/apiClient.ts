// BASE_URL is only used in vite.config.ts as the proxy target.
// NEVER prepend it to fetch() calls — that causes CORS in the browser.
// The /v1 prefix is injected here centrally so all callers use short paths
// like "/auth/login" and "/projects" without worrying about the prefix.
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

  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  //  Inject /v1 prefix centrally — callers just pass "/auth/login", "/projects" etc.
  // Relative path goes through Vite proxy in dev → no CORS.
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `/v1${normalized}`;

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
