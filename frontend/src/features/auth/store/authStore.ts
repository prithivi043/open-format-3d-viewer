import { create } from "zustand";
import type { AuthResponse } from "../types/auth.types";
import { clearTokens, setTokens, getAccessToken } from "../../../lib/token";

type AuthState = {
  user: AuthResponse["user"] | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  setAuth: (data: AuthResponse) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
};

const initialToken = getAccessToken();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: initialToken,
  isAuthenticated: !!initialToken,
  isAuthLoading: true,

  setAuth: (data) => {
    setTokens(data.accessToken, data.refreshToken);

    set({
      user: data.user,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isAuthLoading: false,
    });
  },

  setLoading: (value) =>
    set({
      isAuthLoading: value,
    }),

  logout: () => {
    clearTokens();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthLoading: false,
    });
  },
}));
