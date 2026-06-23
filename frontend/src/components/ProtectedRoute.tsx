import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();

  console.log("ProtectedRoute:", {
    path: location.pathname,
    isAuthenticated,
  });

  // TEMP HACK FOR GOOGLE LOGIN
  if (!isAuthenticated && location.pathname === "/dashboard") {
    setUser({
      id: "google-temp",
      email: "google@temp.com",
      full_name: "Google User",
    });

    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
