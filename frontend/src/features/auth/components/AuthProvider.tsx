import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/authApi";

interface Props {
  children: ReactNode;
}

// These paths should not trigger a /auth/me fetch.
// /auth/callback handles its own hydration after OAuth.
const SKIP_BOOTSTRAP_ROUTES = ["/login", "/register", "/auth/callback"];

export default function AuthProvider({ children }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    const pathname = window.location.pathname;

    if (SKIP_BOOTSTRAP_ROUTES.includes(pathname)) {
      setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [setUser, setLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0D1A] text-white">
        <svg
          className="animate-spin mr-3"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="rgba(167,139,250,0.25)"
            strokeWidth="2.5"
          />
          <path
            d="M10 2 A8 8 0 0 1 18 10"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm text-slate-400">Loading session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
