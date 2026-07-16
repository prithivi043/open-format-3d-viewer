import { useEffect, type ReactNode } from "react";
import { refreshSession, getCurrentUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { isMockModeActive } from "../../../lib/mockApi";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const applyTheme = (themeName: string) => {
      if (
        themeName === "dark" ||
        (themeName === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    const savedTheme = localStorage.getItem("user-pref-theme") || "system";
    applyTheme(savedTheme);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: string }>;
      if (customEvent.detail && customEvent.detail.theme) {
        applyTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener("preferences-updated", handleUpdate);
    return () => {
      window.removeEventListener("preferences-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(window.location.pathname)) {
      useAuthStore.getState().setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        if (isMockModeActive()) {
          // Mock mode: resolve user directly from the mock API handler.
          const user = await getCurrentUser();
          useAuthStore.getState().setUser(user);
          return;
        }

        // If an access token is already in memory (e.g. set by AuthCallback
        // after extracting it from the OAuth redirect URL), use it directly
        // to call /auth/me. This is the path for cross-domain Google OAuth
        // where the Render httpOnly cookie doesn't reach the Vercel domain.
        const existingToken = useAuthStore.getState().accessToken;
        if (existingToken) {
          const user = await getCurrentUser();
          useAuthStore.getState().setUser(user);
          return;
        }

        // Normal browser session: attempt token refresh using the httpOnly
        // refresh_token cookie. Works when frontend and backend share a domain
        // or when using a same-domain proxy (localhost dev server).
        const hasSession = localStorage.getItem("has_session") === "true";
        if (!hasSession) {
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setLoading(false);
          return;
        }

        const user = await refreshSession();
        useAuthStore.getState().setUser(user);
      } catch {
        localStorage.removeItem("has_session");
        useAuthStore.getState().setUser(null);
      } finally {
        useAuthStore.getState().setLoading(false);
      }
    }

    bootstrap();
    // Intentionally empty: getState() is always stable, no deps needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

