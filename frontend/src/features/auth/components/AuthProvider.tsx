import { useEffect, type ReactNode } from "react";
import { getCurrentUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

const SKIP = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    if (SKIP.includes(window.location.pathname)) {
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [setLoading, setUser]);

  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
