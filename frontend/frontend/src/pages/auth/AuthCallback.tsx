import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    async function bootstrap() {
      try {
        const user = await getCurrentUser();
        setUser(user);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error(error);
        navigate("/login", { replace: true });
      }
    }

    bootstrap();
  }, [navigate, setUser]);

  return <div>Completing login...</div>;
}
