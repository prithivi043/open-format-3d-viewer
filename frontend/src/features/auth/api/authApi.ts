import { apiClient } from "../../../lib/apiClient";

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
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (base) {
    return `${base.replace(/\/$/, "")}/auth/google`;
  }

  return "https://open-format-3d-viewer.onrender.com/v1/auth/google";
}

export async function login(payload: LoginPayload): Promise<User> {
  await apiClient<unknown>("/auth/login", {
    method: "POST",
    body: payload,
  });

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
  await apiClient<unknown>("/auth/refresh", {
    method: "POST",
  });

  return getCurrentUser();
}

export async function logoutApi(): Promise<void> {
  await apiClient<unknown>("/auth/logout", {
    method: "POST",
  });
}
