import { useLocation } from "react-router-dom";
import AuthLayout from "../../features/auth/components/AuthLayout";
import SignInForm from "../../features/auth/components/SignInForm";
import SignUpForm from "../../features/auth/components/SignUpForm";

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  return (
    <AuthLayout>{isRegister ? <SignUpForm /> : <SignInForm />}</AuthLayout>
  );
}
