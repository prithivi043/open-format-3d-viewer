import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isAuthLoading);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060816] text-white">
        Loading session...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
