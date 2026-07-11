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

export async function login(payload: LoginPayload): Promise<User> {
  const data = await apiClient<{ access_token?: string }>("/auth/login", {
    method: "POST",
    body: payload,
  });

  if (data?.access_token) {
    useAuthStore.getState().setAccessToken(data.access_token);
  }

  return getCurrentUser();
}

export async function register(payload: SignupPayload): Promise<void> {
  await apiClient<unknown>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/auth/me");
}

export async function refreshSession(): Promise<User> {
  const url = import.meta.env.DEV ? "/v1/auth/refresh" : getAbsoluteUrl("/auth/refresh");
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Session refresh failed");
  }

  const json = await response.json();
  const data = json && typeof json === "object" && "data" in json ? json.data : json;

  if (data?.access_token) {
    useAuthStore.getState().setAccessToken(data.access_token);
  }

  return getCurrentUser();
}

export async function logoutApi(): Promise<void> {
  const url = import.meta.env.DEV ? "/v1/auth/logout" : getAbsoluteUrl("/auth/logout");
  try {
    await fetch(url, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout API request failed:", err);
  }
  useAuthStore.getState().logout();
}
