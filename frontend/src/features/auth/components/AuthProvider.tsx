import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { refreshToken } from "../api/authApi";
import { getRefreshToken, getAccessToken } from "../../../lib/token";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const access = getAccessToken();
        const refresh = getRefreshToken();

        if (access) {
          useAuthStore.setState({
            accessToken: access,
            isAuthenticated: true,
            isAuthLoading: false,
          });
          return;
        }

        if (!refresh) {
          logout();
          return;
        }

        const authData = await refreshToken(refresh);
        setAuth(authData);
      } catch (error) {
        console.error(error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060816] text-white">
        Initializing Session...
      </div>
    );
  }

  return <>{children}</>;
}
