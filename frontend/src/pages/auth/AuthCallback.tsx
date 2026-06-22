import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";

/**
 * WHY THIS FILE WAS CHANGED
 * ─────────────────────────
 * Reverted to the original simple pattern now that apiClient uses absolute
 * URLs (pointing directly at onrender.com).  The browser correctly attaches
 * the onrender.com HttpOnly cookies so /auth/me succeeds on the first call.
 *
 * Additional fix: the URL from the backend callback sometimes carries a
 * `?state=...&code=...` fragment that caused false-positive error detection
 * in prior attempts.  We now only treat `?error=` as a failure signal, and
 * ignore all other query params (they belong to the OAuth exchange that the
 * backend already consumed before redirecting here).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode guard — effect fires twice in dev
    if (ran.current) return;
    ran.current = true;

    async function handleCallback() {
      try {
        // Check if the backend redirected with an explicit error
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get("error");
        if (oauthError) {
          navigate(`/login?error=${encodeURIComponent(oauthError)}`, {
            replace: true,
          });
          return;
        }

        // Backend has already set the HttpOnly session cookies on onrender.com.
        // apiClient now uses an absolute URL to onrender.com, so the browser
        // attaches those cookies automatically — this call succeeds.
        const user = await getCurrentUser();
        setUser(user);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OAuth callback failed:", err);
        setLoading(false);
        navigate("/login?error=oauth_failed", { replace: true });
      }
    }

    handleCallback();
  }, [navigate, setUser, setLoading]);

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
