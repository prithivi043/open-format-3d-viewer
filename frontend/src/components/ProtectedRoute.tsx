import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isAuthLoading);

  console.log("ProtectedRoute", {
    isAuthenticated,
    isLoading,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
