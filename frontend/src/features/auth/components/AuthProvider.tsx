import { useEffect, type ReactNode } from "react";
import { refreshSession, getCurrentUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { isMockModeActive } from "../../../lib/mockApi";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (PUBLIC_ROUTES.includes(window.location.pathname)) {
      useAuthStore.getState().setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        // In mock mode, skip the backend /auth/refresh (would 500 or CORS).
        // Just read the current mock user directly from localStorage.
        if (isMockModeActive()) {
          const user = await getCurrentUser();
          useAuthStore.getState().setUser(user);
        } else {
          const user = await refreshSession();
          useAuthStore.getState().setUser(user);
        }
      } catch {
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

