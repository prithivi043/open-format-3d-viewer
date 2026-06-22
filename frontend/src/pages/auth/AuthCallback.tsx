import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");

    if (oauthError) {
      navigate(`/login?error=${encodeURIComponent(oauthError)}`, {
        replace: true,
      });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthLoading) return;

    console.log("Callback state:", {
      isAuthenticated,
      isAuthLoading,
    });

    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0A0D1A] text-white gap-4">
      <svg
        className="animate-spin"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="rgba(167,139,250,0.2)"
          strokeWidth="3"
        />
        <path
          d="M18 3 A15 15 0 0 1 33 18"
          stroke="#a78bfa"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm text-slate-400 tracking-wide">
        Completing sign in…
      </p>
    </div>
  );
}
