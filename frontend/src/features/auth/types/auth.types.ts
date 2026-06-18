export interface SignUpPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  accessToken: string;
  refreshToken: string;
}
