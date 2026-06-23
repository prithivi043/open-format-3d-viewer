const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalized}`;

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
