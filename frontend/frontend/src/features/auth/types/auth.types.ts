export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  plan?: string;
  provider?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  full_name?: string;
}
