import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isAuthLoading: false,
    }),

  setLoading: (loading) =>
    set({
      isAuthLoading: loading,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
    }),
}));
