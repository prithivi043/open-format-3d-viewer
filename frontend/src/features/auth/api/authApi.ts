import { apiClient } from "../../../lib/apiClient";
import type {
  AuthResponse,
  AuthUser,
  SignInPayload,
  SignUpPayload,
} from "../types/auth.types";

type RawAuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

const mapAuth = (res: RawAuthResponse): AuthResponse => ({
  user: null,
  accessToken: res.access_token,
  refreshToken: res.refresh_token,
});

export const register = async (data: SignUpPayload): Promise<AuthResponse> => {
  console.log("REGISTER PAYLOAD:", data);
  const res = await apiClient<RawAuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return mapAuth(res);
};

export const login = async (data: SignInPayload): Promise<AuthResponse> => {
  const res = await apiClient<RawAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  console.log("LOGIN RESPONSE:", res);

  return mapAuth(res);
};

export const refreshToken = async (
  refresh_token: string,
): Promise<AuthResponse> => {
  const res = await apiClient<RawAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });

  return mapAuth(res);
};

export const logout = (refreshToken: string) =>
  apiClient<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

export const getMe = () => apiClient("/auth/me");
