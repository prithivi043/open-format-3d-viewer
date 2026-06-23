import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const id = params.get("id");
    const email = params.get("email");
    const full_name = params.get("name");

    if (!id || !email) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    setUser({
      id,
      email,
      full_name: full_name ?? "",
    });

    setLoading(false);
    navigate("/dashboard", { replace: true });
  }, [navigate, setUser, setLoading]);

  return <div>Signing in...</div>;
}
