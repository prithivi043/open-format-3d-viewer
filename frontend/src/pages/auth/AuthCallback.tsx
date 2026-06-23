import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { getCurrentUser } from "../../features/auth/api/authApi";

export default function AuthCallback() {
  console.log("AuthCallback mounted");
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    async function hydrate() {
      try {
        const user = await getCurrentUser();

        console.log("OAuth user:", user);

        setUser(user);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("OAuth callback failed:", error);
        setLoading(false);
        navigate("/login", { replace: true });
      }
    }

    hydrate();
  }, [navigate, setUser, setLoading]);

  return (
    <div className="h-screen flex items-center justify-center">
      Completing Google sign in...
    </div>
  );
}
