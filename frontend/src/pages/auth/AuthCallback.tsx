import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuthStore();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }

    if (!isAuthLoading && !isAuthenticated) {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#0A0D1A] text-white">
      Completing sign in...
    </div>
  );
}
