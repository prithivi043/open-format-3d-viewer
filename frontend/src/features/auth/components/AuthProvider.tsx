import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/authApi";

interface Props {
  children: ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthProvider({ children }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    const pathname = window.location.pathname;

    async function bootstrap() {
      if (PUBLIC_ROUTES.includes(pathname)) {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.log("No active session", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [setUser, setLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060816] text-white">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}
