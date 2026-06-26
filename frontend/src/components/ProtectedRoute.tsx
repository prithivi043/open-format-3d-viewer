import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
