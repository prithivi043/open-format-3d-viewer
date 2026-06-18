import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.accessToken);

  console.log("ProtectedRoute token:", token);

  if (!token) {
    console.log("Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Allow dashboard");
  return <Outlet />;
}
