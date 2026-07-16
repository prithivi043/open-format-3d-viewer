import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";

/**
 * Handles the post-Google-OAuth redirect.
 *
 * The backend can redirect here in two ways:
 *
 * 1. Token-in-URL (preferred for cross-domain deployments):
 *    /auth/callback?token=<access_token>
 *    The access_token is stored in memory first, then /auth/me is called
 *    with a Bearer header — works even when auth cookies are set on a
 *    different domain (e.g. onrender.com vs vercel.app).
 *
 * 2. Cookie-only (legacy / same-domain):
 *    /auth/callback (no token param)
 *    Falls back to calling /auth/me relying on the httpOnly cookie being
 *    present — only works when frontend and backend share the same domain.
 *
 * Root cause of the wrong-user bug:
 *   The backend currently redirects to `/dashboard` (not `/auth/callback`)
 *   AND sets cookies on the Render domain — those cookies never reach the
 *   Vercel domain, so /auth/me is called unauthenticated, returning either
 *   a 401 (user stays logged out) or a stale cached identity.
 *   Fix: ask the backend owner to set FRONTEND_URL to point at this
 *   /auth/callback page and append ?token=<access_token> to the redirect.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
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

      // Extract access token from URL if the backend passes it as a query
      // param (required for cross-domain deployments where cookies can't
      // cross the onrender.com → vercel.app domain boundary).
      const urlToken = params.get("token") || params.get("access_token");

      try {
        setLoading(true);

        // If a token is present in the URL, store it BEFORE calling /auth/me
        // so apiClient attaches it as a Bearer header.
        if (urlToken) {
          setAccessToken(urlToken);
          // Clean the token out of the browser history — it's sensitive.
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        }

        const user = await getCurrentUser();
        setUser(user);
        localStorage.setItem("has_session", "true");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        localStorage.removeItem("has_session");
        console.error("OAuth callback failed:", error);
        // Clear any partially-stored token so the user gets a clean login.
        setAccessToken(null);
        navigate("/login?error=oauth_failed", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    handleOAuth();
  }, [navigate, setUser, setAccessToken, setLoading]);

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
      <p>Completing sign in…</p>
    </div>
  );
}
