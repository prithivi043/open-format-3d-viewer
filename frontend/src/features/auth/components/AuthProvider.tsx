import { useEffect, type ReactNode } from "react";
import { refreshSession } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(window.location.pathname)) {
      setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        const user = await refreshSession();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [setLoading, setUser]);

  return <>{children}</>;
}
