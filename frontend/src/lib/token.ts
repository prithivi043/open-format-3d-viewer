let accessToken: string | null = localStorage.getItem("access_token");
let refreshToken: string | null = localStorage.getItem("refresh_token");

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;

  if (access) {
    localStorage.setItem("access_token", access);
  } else {
    localStorage.removeItem("access_token");
  }

  if (refresh) {
    localStorage.setItem("refresh_token", refresh);
  } else {
    localStorage.removeItem("refresh_token");
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
