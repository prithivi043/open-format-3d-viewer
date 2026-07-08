import { create } from "zustand";
import type { User } from "../api/authApi";
import type { PlanType } from "../../settings/types/settings.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  plan: PlanType;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPlan: (plan: PlanType) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  plan: (localStorage.getItem("user-plan") as PlanType) || "Free",
  accessToken: null,

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

  setPlan: (plan) => {
    localStorage.setItem("user-plan", plan);
    set({ plan });
  },

  setAccessToken: (accessToken) =>
    set({
      accessToken,
    }),

  logout: () => {
    localStorage.removeItem("user-plan");

    set({
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
      plan: "Free",
      accessToken: null,
    });
  },
}));
