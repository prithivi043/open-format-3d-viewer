import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isAuthLoading);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060816] text-white">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname === "/auth/callback") {
      return null;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
