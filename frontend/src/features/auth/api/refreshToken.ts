import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "../../../lib/token";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error("Refresh token expired");
  }

  const json = await res.json();

  console.log("REFRESH RESPONSE:", json);

  const newAccess = json.access_token ?? json.data?.access_token;
  const newRefresh = json.refresh_token ?? json.data?.refresh_token;

  if (!newAccess) {
    throw new Error("No access token returned");
  }

  setAccessToken(newAccess);

  if (newRefresh) {
    setRefreshToken(newRefresh);
  }

  return newAccess;
}
