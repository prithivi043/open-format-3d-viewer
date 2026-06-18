import type { ApiErrorResponse, ApiResponse } from "./api.types";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./token";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  let res: Response;

  try {
    res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
  } catch {
    throw new Error("Backend unavailable");
  }

  if (!res.ok) {
    throw new Error("Refresh token expired");
  }

  const json = await res.json();

  const newAccessToken = json.data?.accessToken ?? json.data?.access_token;

  if (!newAccessToken) {
    throw new Error("Invalid refresh response");
  }

  setTokens(newAccessToken, refreshToken);

  return newAccessToken;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const execute = async (token?: string) => {
    try {
      return await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        "Backend server unavailable / crashed. Contact backend developer.",
      );
    }
  };

  let token = getAccessToken();
  let res = await execute(token ?? undefined);

  if (res.status === 401) {
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      token = await refreshPromise;
      res = await execute(token);
    } catch {
      clearTokens();
      throw new Error("Session expired. Please login again.");
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  if (!res.ok) {
    let message = `API Error (${res.status})`;

    try {
      const errorJson: ApiErrorResponse = await res.json();
      message =
        errorJson?.error?.message ||
        JSON.stringify(errorJson?.detail) ||
        message;
    } catch {
      if (res.status >= 500) {
        message = "Backend internal server error. Likely DB or server issue.";
      }
    }

    throw new Error(message);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}
