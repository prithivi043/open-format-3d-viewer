import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    async function handleOAuth() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");

      if (oauthError) {
        navigate(`/login?error=${encodeURIComponent(oauthError)}`, {
          replace: true,
        });
        return;
      }

      try {
        setLoading(true);
        const user = await getCurrentUser();
        setUser(user);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error(error);
        navigate("/login?error=oauth_failed", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    handleOAuth();
  }, [navigate, setUser, setLoading]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0D1A",
        color: "#fff",
        gap: "16px",
      }}
    >
      <p>Completing sign in...</p>
    </div>
  );
}
