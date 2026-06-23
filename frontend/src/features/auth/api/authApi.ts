import { apiClient } from "../../../lib/apiClient";
import type {
  AuthResponse,
  SignInPayload,
  SignUpPayload,
  AuthUser,
} from "../types/auth.types";

export async function login(data: SignInPayload): Promise<AuthResponse> {
  const user = await apiClient<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return { user };
}

export async function register(data: SignUpPayload): Promise<AuthResponse> {
  const user = await apiClient<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return { user };
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiClient<AuthUser>("/auth/me", {
    method: "GET",
  });
}

export async function logout(): Promise<void> {
  await apiClient("/auth/logout", {
    method: "POST",
  });
}
