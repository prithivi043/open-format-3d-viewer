import { create } from "zustand";
import type { User } from "../api/authApi";
import type { PlanType } from "../../settings/types/settings.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  plan: PlanType;
  accessToken: string | null;
  /** Storage quota in bytes — sourced from the user's plan or the backend /auth/me field */
  storageQuotaBytes: number;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPlan: (plan: PlanType) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

// Plan-based default storage quotas
const FREE_QUOTA_BYTES = 10 * 1_073_741_824;   // 10 GB
const PLAN_STORAGE_BYTES: Record<string, number> = {
  Free: FREE_QUOTA_BYTES,
  Pro: 100 * 1_073_741_824,          // 100 GB
  Enterprise: 1_000 * 1_073_741_824, // 1 TB
};

/** Derive storage quota: prefer explicit backend value, fall back to plan default */
function resolveStorageQuota(user: User | null, plan: PlanType): number {
  if (user?.storage_quota_bytes && user.storage_quota_bytes > 0) {
    return user.storage_quota_bytes;
  }
  return PLAN_STORAGE_BYTES[plan] ?? FREE_QUOTA_BYTES;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  plan: (localStorage.getItem("user-plan") as PlanType) || "Free",
  accessToken: null,
  storageQuotaBytes: FREE_QUOTA_BYTES,

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
      isAuthLoading: false,
      storageQuotaBytes: resolveStorageQuota(user, state.plan),
    })),

  setLoading: (loading) =>
    set({
      isAuthLoading: loading,
    }),

  setPlan: (plan) => {
    localStorage.setItem("user-plan", plan);
    set((state) => ({
      plan,
      storageQuotaBytes: resolveStorageQuota(state.user, plan),
    }));
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
      storageQuotaBytes: FREE_QUOTA_BYTES,
    });
  },
}));
