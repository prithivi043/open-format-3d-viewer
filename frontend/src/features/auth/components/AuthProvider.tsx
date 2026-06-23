import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/authApi";

interface Props {
  children: ReactNode;
}

const SKIP_ROUTES = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    const pathname = window.location.pathname;

    if (SKIP_ROUTES.includes(pathname)) {
      setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error("Bootstrap auth failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [setUser, setLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}
