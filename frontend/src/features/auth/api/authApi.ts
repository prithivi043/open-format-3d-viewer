import { apiClient } from "../../../lib/apiClient";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../../../lib/config";

const getAbsoluteUrl = (path: string): string => {
  const base = API_BASE_URL.endsWith("/v1") ? API_BASE_URL.slice(0, -3) : API_BASE_URL;
  return `${base}/v1${path}`;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  /** Storage quota in bytes as returned by /auth/me (optional — backend may omit it) */
  storage_quota_bytes?: number;
  /** Plan type returned by /auth/me (e.g. "Free", "Pro", "Enterprise") */
  plan?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  full_name: string;
  email: string;
  password: string;
};

export function getGoogleAuthUrl(): string {
  // Must use the absolute Render URL for OAuth initiation.
  // Google Console is configured with the callback URL on the onrender.com domain.
  // Initiating the flow on the same onrender.com domain ensures the Starlette
  // state/session cookies match the callback domain, preventing "oauth_failed" state mismatches.
  const base = API_BASE_URL.endsWith("/v1") ? API_BASE_URL.slice(0, -3) : API_BASE_URL;
  return `${base}/v1/auth/google`;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export async function login(payload: LoginPayload): Promise<User> {
  const data = await apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });

  if (data?.access_token) {
    useAuthStore.getState().setAccessToken(data.access_token);
  }

  localStorage.setItem("has_session", "true");
  
  if (data?.user) {
    return data.user;
  }
  return getCurrentUser();
}

export async function register(payload: SignupPayload): Promise<void> {
  const data = await apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });

  if (data?.access_token) {
    useAuthStore.getState().setAccessToken(data.access_token);
  }

  localStorage.setItem("has_session", "true");
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/auth/me");
}

export async function refreshSession(): Promise<User> {
  const url = import.meta.env.DEV ? "/v1/auth/refresh" : getAbsoluteUrl("/auth/refresh");
  
  const headers: Record<string, string> = {};
  const csrfToken = document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1];
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      throw new Error("Session refresh failed");
    }

    const json = await response.json();
    const data = json && typeof json === "object" && "data" in json ? json.data : json;

    if (data?.access_token) {
      useAuthStore.getState().setAccessToken(data.access_token);
    }

    localStorage.setItem("has_session", "true");
    
    if (data?.user) {
      return data.user;
    }
    return getCurrentUser();
  } catch (err) {
    localStorage.removeItem("has_session");
    throw err;
  }
}

export async function logoutApi(): Promise<void> {
  localStorage.removeItem("has_session");
  const url = import.meta.env.DEV ? "/v1/auth/logout" : getAbsoluteUrl("/auth/logout");
  
  const headers: Record<string, string> = {};
  const token = useAuthStore.getState().accessToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const csrfToken = document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1];
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    });
  } catch (err) {
    console.error("Logout API request failed:", err);
  }
  useAuthStore.getState().logout();
}
