import { Outlet } from "react-router-dom";
import AuthProvider from "../features/auth/components/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
